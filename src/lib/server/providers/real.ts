// RealProvider (optional, OFF by default). Used only when PRICELENS_PROVIDER=real
// and SERPAPI_API_KEY are set (see .env.example / README).
//  - Image detection: Google Cloud Vision WEB_DETECTION + LABEL_DETECTION when
//    GOOGLE_VISION_API_KEY is set (image bytes are sent once, in memory, never stored);
//    otherwise the demo colour matcher guesses the category and that is searched.
//  - Prices: SerpAPI Google Shopping (shopping_results), cheapest first.
// Every outbound call has a timeout; failures surface as a friendly API error.
import { categoryArt } from '../../art.ts';
import { deliveryText, hash, isoDate } from '../../format.ts';
import { storeIdFromName, storeMeta } from '../../stores.ts';
import { CATEGORIES, CATEGORY_LABEL, type Category, type Detection, type Listing, type PriceCheck, type Product, type SearchRequest, type SearchResponse, type Suggestion } from '../../types.ts';
import { detect as mockDetect } from './mock.ts';
import type { PriceCheckItem, Provider } from './types.ts';

export interface RealConfig {
	serpApiKey: string;
	visionKey?: string;
	country: string;
	language: string;
}

const TIMEOUT_MS = 9000;

const CATEGORY_WORDS: Record<Exclude<Category, 'other'>, string[]> = {
	dress: ['dress', 'gown', 'frock', 'day dress', 'cocktail dress', 'sundress'],
	shirt: ['shirt', 't-shirt', 'top', 'blouse', 'sleeve', 'polo', 'kurta', 'jersey'],
	shoes: ['shoe', 'sneaker', 'footwear', 'boot', 'sandal', 'trainer', 'heel'],
	bag: ['bag', 'backpack', 'handbag', 'luggage', 'purse', 'tote', 'wallet'],
	watch: ['watch', 'clock', 'wristwatch', 'smartwatch', 'timepiece'],
	phone: ['phone', 'smartphone', 'mobile phone', 'iphone', 'android', 'feature phone'],
	headphones: ['headphones', 'earbuds', 'earphones', 'headset', 'audio equipment', 'airpods']
};

export function categoryFromLabels(labels: string[]): Category | null {
	const text = labels.join(' | ').toLowerCase();
	let best: Category | null = null;
	let bestIdx = Infinity;
	for (const c of CATEGORIES) {
		if (c === 'other') continue;
		for (const w of CATEGORY_WORDS[c]) {
			const i = text.indexOf(w);
			if (i >= 0 && i < bestIdx) {
				bestIdx = i;
				best = c;
			}
		}
	}
	return best;
}

async function fetchJson(url: string, init?: RequestInit): Promise<any> {
	const ctrl = new AbortController();
	const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
	try {
		const r = await fetch(url, { ...init, signal: ctrl.signal });
		if (!r.ok) throw new Error(`upstream ${r.status}`);
		return await r.json();
	} finally {
		clearTimeout(t);
	}
}

function toBase64(bytes: Uint8Array): string {
	return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');
}

function num(v: unknown): number {
	const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[^0-9.]/g, ''));
	return Number.isFinite(n) ? n : 0;
}

function parseDays(text: string): number {
	const t = text.toLowerCase();
	if (/today|tomorrow|1 day/.test(t)) return 1;
	const m = /(\d+)\s*(?:-|to)?\s*(\d+)?\s*(?:business\s*)?day/.exec(t);
	if (m) return Number(m[2] ?? m[1]);
	return 99;
}

export class RealProvider implements Provider {
	readonly name = 'real' as const;
	private cfg: RealConfig;
	constructor(cfg: RealConfig) {
		this.cfg = cfg;
	}

	private async vision(bytes: Uint8Array): Promise<{ label: string; labels: string[] } | null> {
		if (!this.cfg.visionKey) return null;
		const body = {
			requests: [
				{
					image: { content: toBase64(bytes) },
					features: [
						{ type: 'WEB_DETECTION', maxResults: 8 },
						{ type: 'LABEL_DETECTION', maxResults: 10 }
					]
				}
			]
		};
		const j = await fetchJson(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(this.cfg.visionKey)}`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});
		const res = j?.responses?.[0] ?? {};
		const best: string = res.webDetection?.bestGuessLabels?.[0]?.label ?? '';
		const entities: string[] = (res.webDetection?.webEntities ?? []).filter((e: any) => e.description && (e.score ?? 0) > 0.4).map((e: any) => e.description);
		const labels: string[] = (res.labelAnnotations ?? []).map((l: any) => l.description);
		const all = [best, ...entities, ...labels].filter(Boolean);
		if (all.length === 0) return null;
		return { label: best || entities[0] || labels[0], labels: all };
	}

	private async shopping(query: string): Promise<any[]> {
		const u = new URL('https://serpapi.com/search.json');
		u.searchParams.set('engine', 'google_shopping');
		u.searchParams.set('q', query);
		u.searchParams.set('gl', this.cfg.country);
		u.searchParams.set('hl', this.cfg.language);
		u.searchParams.set('api_key', this.cfg.serpApiKey);
		const j = await fetchJson(u.toString());
		return Array.isArray(j?.shopping_results) ? j.shopping_results : [];
	}

	private toListings(rows: any[], query: string): Listing[] {
		return rows
			.filter((r) => num(r.extracted_price ?? r.price) > 0)
			.slice(0, 20)
			.map((r, i) => {
				const storeName: string = r.source || 'Store';
				const store = storeIdFromName(storeName);
				const meta = storeMeta(store, storeName);
				const price = num(r.extracted_price ?? r.price);
				const mrp = num(r.extracted_old_price ?? r.old_price);
				const delivery: string = r.delivery || '';
				const days = parseDays(delivery);
				return {
					id: `live-${hash(`${storeName}:${r.title}:${i}`)}`,
					store,
					storeName: meta.name,
					title: String(r.title ?? query),
					brand: String(r.source ?? '').trim() && r.title ? String(r.title).split(/\s+/)[0] : 'Unbranded',
					price,
					mrp: mrp > price ? mrp : 0,
					discountPct: mrp > price ? Math.round((1 - price / mrp) * 100) : 0,
					rating: num(r.rating),
					ratingCount: num(r.reviews),
					deliveryDays: days,
					deliveryText: delivery || deliveryText(days),
					url: String(r.product_link || r.link || meta.search(r.title ?? query)),
					inStock: true
				} satisfies Listing;
			});
	}

	async search(req: SearchRequest): Promise<SearchResponse> {
		let detection: Detection;
		let query = (req.query ?? '').trim();
		let notice: string | undefined;
		if (!query && req.image && this.cfg.visionKey) {
			const v = await this.vision(req.image.bytes).catch(() => null);
			if (v) {
				const category = categoryFromLabels(v.labels);
				detection = { label: v.label, category: category ?? 'other', confidence: category ? 0.8 : 0.4, uncertain: !category, reason: category ? undefined : 'low-confidence', method: 'vision' };
				query = v.label;
			} else {
				detection = { label: '', category: null, confidence: 0, uncertain: true, reason: 'low-confidence', method: 'vision' };
			}
		} else if (!query) {
			// No vision key: reuse the demo matcher to guess a category, then search that live.
			const d = mockDetect({ ...req, productId: undefined }).detection;
			detection = d;
			query = d.uncertain ? '' : req.category ? CATEGORY_LABEL[req.category] : d.label;
			if (!this.cfg.visionKey) notice = 'Live prices on; photo detection uses the simple colour matcher (no GOOGLE_VISION_API_KEY).';
		} else {
			detection = { label: query, category: req.category ?? categoryFromLabels([query]) ?? 'other', confidence: 0.95, uncertain: false, method: 'text' };
		}
		if (detection.uncertain || !query) {
			return { ok: true, mode: 'live', query, notice, detected: detection, product: null, similar: [], cheaper: [] };
		}
		const rows = await this.shopping(query);
		const listings = this.toListings(rows, query).sort((a, b) => a.price - b.price);
		const category = detection.category ?? 'other';
		if (listings.length === 0) {
			return { ok: true, mode: 'live', query, notice, detected: { ...detection, reason: 'no-product' }, product: null, similar: [], cheaper: [] };
		}
		// Main product = up to 8 cheapest offers; the rest become suggestions.
		const main = listings.slice(0, 8);
		const rest = rows.slice(8, 20);
		const best = main[0].price;
		const thumb = rows.find((r) => r.thumbnail)?.thumbnail as string | undefined;
		const product: Product = {
			id: `live-${hash(query.toLowerCase())}`,
			name: query.replace(/\b\w/g, (c) => c.toUpperCase()),
			brand: main[0].brand,
			category,
			description: `Live results from Google Shopping for "${query}".`,
			images: [thumb ?? categoryArt(category), ...rows.slice(1, 4).map((r) => r.thumbnail).filter(Boolean)],
			colours: [],
			sizes: [],
			listings: main,
			priceHistory: [{ date: isoDate(new Date()), price: best }],
			source: 'live'
		};
		const toSug = (r: any): Suggestion => {
			const storeName = r.source || 'Store';
			const store = storeIdFromName(storeName);
			return {
				id: `live-${hash(String(r.title))}`,
				name: String(r.title),
				brand: String(r.title).split(/\s+/)[0],
				category,
				image: r.thumbnail || categoryArt(category),
				price: num(r.extracted_price ?? r.price),
				mrp: num(r.extracted_old_price),
				rating: num(r.rating),
				store,
				storeName: storeMeta(store, storeName).name,
				url: String(r.product_link || r.link || ''),
				hasDetail: false
			};
		};
		const sugs = rest.filter((r) => num(r.extracted_price ?? r.price) > 0).map(toSug);
		return {
			ok: true,
			mode: 'live',
			query,
			notice,
			detected: detection,
			product,
			similar: sugs.filter((s) => s.price >= best).slice(0, 6),
			cheaper: sugs.filter((s) => s.price < best).slice(0, 6)
		};
	}

	async product() {
		// Live products are cached in the browser from the search response.
		return null;
	}

	async prices(items: PriceCheckItem[]): Promise<PriceCheck[]> {
		const out: PriceCheck[] = [];
		for (const it of items.slice(0, 5)) {
			if (!it.query) {
				out.push({ id: it.id, price: null });
				continue;
			}
			try {
				const l = this.toListings(await this.shopping(it.query), it.query).sort((a, b) => a.price - b.price)[0];
				out.push({ id: it.id, price: l?.price ?? null, storeName: l?.storeName });
			} catch {
				out.push({ id: it.id, price: null });
			}
		}
		return out;
	}
}
