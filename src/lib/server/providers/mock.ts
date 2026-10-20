// MockProvider (default, no API keys): matches the uploaded photo to one of the 5
// sample groups by its dominant colours (computed in the browser, background
// removed), with filename / text keywords and a manual category picker as fallbacks.
// Uncertain or blurry photos return `detected.uncertain = true` and no product so
// the UI can show the "Not sure what this is?" picker.
import { COLOUR_NAME, type ColourClass } from '../../colour.ts';
import { hash, retailRound, rng } from '../../format.ts';
import { CATEGORY_LABEL, type Category, type Detection, type ImageFeatures, type PriceCheck, type SearchRequest, type SearchResponse } from '../../types.ts';
import { CATALOG, GROUPS, bestOf, getProduct, groupForCategory, mainProduct, suggestionsFor, type Group, type GroupKey } from '../catalog.ts';
import type { PriceCheckItem, Provider } from './types.ts';

/** Below this Laplacian variance a photo is treated as blurry. */
export const BLUR_THRESHOLD = 14;
/** Below this foreground share there is "no product" in the frame. */
export const MIN_COVERAGE = 0.05;
/** Colour-match confidence needed to skip the "Not sure" screen. */
export const MIN_CONFIDENCE = 0.5;

const STOP = new Set(['for', 'and', 'with', 'the', 'a', 'an', 'of', 'in', 'men', 'women', 'womens', 'mens', 'unisex', 'new', 'buy', 'cheap', 'best', 'online', 'price']);

function words(text: string): string[] {
	return text
		.toLowerCase()
		.split(/[^a-z0-9-]+/)
		.filter((w) => w.length > 1 && !STOP.has(w));
}

/** Text -> group (+ a specific catalog product when its own words match). */
export function matchText(text: string): { group: Group; productId: string; score: number } | null {
	const ws = words(text);
	if (ws.length === 0) return null;
	const phrase = ` ${ws.join(' ')} `;
	// Exact word (or simple plural) for single-word keywords, whole phrase for multi-word ones.
	const hit = (k: string, w: string) => k === w || w === `${k}s` || w === `${k}es` || k === `${w}s`;
	let best: { group: Group; productId: string; score: number } | null = null;
	for (const g of GROUPS) {
		const groupHits =
			ws.filter((w) => g.keywords.some((k) => !k.includes(' ') && hit(k, w))).length +
			g.keywords.filter((k) => k.includes(' ') && phrase.includes(` ${k} `)).length;
		if (groupHits === 0) continue;
		// Prefer the catalog product whose own words overlap most (e.g. "chunky platform sneakers").
		let productId = mainProduct(g.key).id;
		let top = 0;
		for (const e of CATALOG.values()) {
			if (e.group.key !== g.key) continue;
			const hits = ws.filter((w) => e.words.includes(w) && !g.keywords.includes(w)).length;
			if (hits > top) {
				top = hits;
				productId = e.product.id;
			}
		}
		const score = groupHits * 2 + top;
		if (!best || score > best.score) best = { group: g, productId, score };
	}
	return best;
}

export interface ColourMatch {
	group: Group;
	confidence: number;
	scores: Record<GroupKey, number>;
	dominant: { name: string; hex: string } | null;
}

/** Score every sample group against the photo's background-free palette. */
export function matchColours(features: ImageFeatures): ColourMatch {
	const scores = Object.fromEntries(GROUPS.map((g) => [g.key, 0])) as Record<GroupKey, number>;
	for (const sw of features.palette) {
		const cls = sw.name as ColourClass;
		for (const g of GROUPS) scores[g.key] += sw.share * (g.colours[cls] ?? 0);
	}
	const ranked = [...GROUPS].sort((a, b) => scores[b.key] - scores[a.key]);
	const s1 = scores[ranked[0].key];
	const s2 = scores[ranked[1].key];
	// Margin over the runner-up, damped when the best match explains little of the photo.
	const margin = s1 > 0 ? (s1 - s2) / s1 : 0;
	const strength = Math.min(1, s1 / 0.45);
	const confidence = Math.round(Math.max(0, Math.min(1, (0.25 + 0.75 * margin) * strength)) * 100) / 100;
	const top = features.palette[0];
	return { group: ranked[0], confidence, scores, dominant: top ? { name: COLOUR_NAME[top.name as ColourClass] ?? top.name, hex: top.hex } : null };
}

function categoryOf(group: Group | null): Category | null {
	return group?.category ?? null;
}

export function detect(req: SearchRequest): { detection: Detection; productId: string | null } {
	// 1. Explicit product (history re-run / shared link)
	if (req.productId && CATALOG.has(req.productId)) {
		const e = CATALOG.get(req.productId)!;
		return { detection: { label: e.product.name, category: e.group.category, confidence: 1, uncertain: false, method: 'text' }, productId: e.product.id };
	}
	// 2. Typed text (optionally combined with a picked category)
	const q = (req.query ?? '').trim();
	if (q) {
		const m = matchText(q);
		if (m && (!req.category || req.category === m.group.category)) {
			return { detection: { label: q, category: m.group.category, confidence: 0.95, uncertain: false, method: 'text' }, productId: m.productId };
		}
		const g = groupForCategory(req.category);
		if (g) return { detection: { label: q, category: g.category, confidence: 0.9, uncertain: false, method: 'category' }, productId: mainProduct(g.key).id };
		return { detection: { label: q, category: req.category ?? 'other', confidence: 0, uncertain: false, reason: 'no-product', method: 'text' }, productId: null };
	}
	// 3. Picked category chip
	if (req.category) {
		const g = groupForCategory(req.category);
		return {
			detection: { label: CATEGORY_LABEL[req.category], category: req.category, confidence: g ? 0.9 : 0, uncertain: false, reason: g ? undefined : 'no-product', method: 'category' },
			productId: g ? mainProduct(g.key).id : null
		};
	}
	// 4. Photo
	const f = req.features;
	if (!f) return { detection: { label: '', category: null, confidence: 0, uncertain: true, reason: 'no-product', method: 'colour' }, productId: null };
	const byName = req.fileName ? matchText(req.fileName.replace(/\.[a-z0-9]+$/i, '').replace(/[_]+/g, ' ')) : null;
	if (f.sharpness < BLUR_THRESHOLD) {
		return { detection: { label: 'Blurry photo', category: categoryOf(byName?.group ?? null), confidence: 0, uncertain: true, reason: 'blurry', method: 'colour' }, productId: null };
	}
	if (byName) {
		return { detection: { label: byName.group.label, category: byName.group.category, confidence: 0.85, uncertain: false, method: 'filename' }, productId: byName.productId };
	}
	if (f.coverage < MIN_COVERAGE) {
		return { detection: { label: 'Nothing found', category: null, confidence: 0, uncertain: true, reason: 'no-product', method: 'colour' }, productId: null };
	}
	const m = matchColours(f);
	const colour = m.dominant ?? undefined;
	if (m.confidence < MIN_CONFIDENCE) {
		return { detection: { label: m.group.label, category: m.group.category, confidence: m.confidence, uncertain: true, reason: 'low-confidence', method: 'colour', colour }, productId: null };
	}
	return { detection: { label: m.group.label, category: m.group.category, confidence: m.confidence, uncertain: false, method: 'colour', colour }, productId: mainProduct(m.group.key).id };
}

export class MockProvider implements Provider {
	readonly name = 'mock' as const;

	async search(req: SearchRequest): Promise<SearchResponse> {
		const { detection, productId } = detect(req);
		const product = productId ? getProduct(productId) : null;
		const { similar, cheaper } = productId ? suggestionsFor(productId) : { similar: [], cheaper: [] };
		if (product && detection.method !== 'text') detection.label = product.name;
		return {
			ok: true,
			mode: 'demo',
			query: req.query?.trim() || product?.name || detection.label,
			detected: detection,
			product,
			similar,
			cheaper
		};
	}

	async product(id: string) {
		const product = getProduct(id);
		if (!product) return null;
		return { product, ...suggestionsFor(id) };
	}

	/** Demo price check: a simulated move of -14% .. +6% around today's best price per refresh tick. */
	async prices(items: PriceCheckItem[]): Promise<PriceCheck[]> {
		return items.map((it) => {
			const p = getProduct(it.id);
			if (!p) return { id: it.id, price: null };
			const best = bestOf(p);
			const store = [...p.listings].sort((a, b) => a.price - b.price)[0].storeName;
			if (!it.tick) return { id: it.id, price: best, storeName: store };
			const f = 0.86 + rng(hash(`${it.id}:${it.tick}`))() * 0.2;
			return { id: it.id, price: retailRound(best * f), storeName: store };
		});
	}
}
