// Pure data model for everything PriceLens keeps in localStorage, plus
// normalisation of imported JSON backups (unit-tested, no DOM access here).
import { CATEGORIES, type Category } from '../types.ts';

export interface WishItem {
	id: string;
	name: string;
	image: string;
	category: Category;
	price: number; // best price at the time of saving
	storeName: string;
	url: string;
	query: string;
	source: 'demo' | 'live';
	savedAt: string;
}

export interface HistoryItem {
	id: string;
	at: string;
	thumb: string; // small data URL / generated art ('' for text searches)
	label: string;
	category: Category | null;
	query: string;
	productId: string | null;
	bestPrice: number | null;
	kind: 'photo' | 'text' | 'category';
	mode: 'demo' | 'live';
}

export interface AlertItem {
	id: string; // product id
	name: string;
	image: string;
	query: string;
	target: number;
	startPrice: number;
	currentPrice: number;
	storeName: string;
	createdAt: string;
	checkedAt: string | null;
	checks: number;
	reached: boolean;
	reachedAt: string | null;
}

export interface Settings {
	budgetMin: number;
	budgetMax: number;
	hideOutsideBudget: boolean;
	hiddenStores: string[];
}

export interface AppData {
	version: 1;
	wishlist: WishItem[];
	history: HistoryItem[];
	alerts: AlertItem[];
	settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = { budgetMin: 0, budgetMax: 0, hideOutsideBudget: false, hiddenStores: [] };
export const MAX_HISTORY = 30;

export function emptyData(): AppData {
	return { version: 1, wishlist: [], history: [], alerts: [], settings: { ...DEFAULT_SETTINGS, hiddenStores: [] } };
}

const str = (v: unknown, max = 300) => (typeof v === 'string' ? v.slice(0, max) : '');
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : 0);
const cat = (v: unknown): Category | null => (typeof v === 'string' && (CATEGORIES as readonly string[]).includes(v) ? (v as Category) : null);
/** Images: generated art / thumbnails as data: URLs or https URLs only. */
const img = (v: unknown) => {
	const s = typeof v === 'string' ? v : '';
	return s.length < 400_000 && (s.startsWith('data:image/') || s.startsWith('https://')) ? s : '';
};
const url = (v: unknown) => {
	const s = str(v, 1000);
	return /^https?:\/\//.test(s) ? s : '';
};
const date = (v: unknown) => {
	const s = str(v, 40);
	return s && !Number.isNaN(new Date(s).getTime()) ? s : new Date().toISOString();
};
const arr = (v: unknown): any[] => (Array.isArray(v) ? v : []);

/** Validate + clean any parsed JSON into AppData (unknown / broken fields are dropped). */
export function normalizeData(input: unknown): AppData {
	const d = (input && typeof input === 'object' ? input : {}) as Record<string, any>;
	const s = (d.settings ?? {}) as Record<string, any>;
	const seen = new Set<string>();
	const uniq = <T extends { id: string }>(xs: T[]) => xs.filter((x) => x.id && !seen.has(x.id) && (seen.add(x.id), true));
	const wishlist = uniq(
		arr(d.wishlist).map(
			(w): WishItem => ({
				id: str(w?.id, 80),
				name: str(w?.name, 200) || 'Saved product',
				image: img(w?.image),
				category: cat(w?.category) ?? 'other',
				price: num(w?.price),
				storeName: str(w?.storeName, 60),
				url: url(w?.url),
				query: str(w?.query, 120),
				source: w?.source === 'live' ? 'live' : 'demo',
				savedAt: date(w?.savedAt)
			})
		)
	);
	seen.clear();
	const history = uniq(
		arr(d.history).map(
			(h): HistoryItem => ({
				id: str(h?.id, 80),
				at: date(h?.at),
				thumb: img(h?.thumb),
				label: str(h?.label, 200) || 'Search',
				category: cat(h?.category),
				query: str(h?.query, 120),
				productId: str(h?.productId, 80) || null,
				bestPrice: typeof h?.bestPrice === 'number' ? num(h.bestPrice) : null,
				kind: h?.kind === 'photo' || h?.kind === 'category' ? h.kind : 'text',
				mode: h?.mode === 'live' ? 'live' : 'demo'
			})
		)
	).slice(0, MAX_HISTORY);
	seen.clear();
	const alerts = uniq(
		arr(d.alerts).map((a): AlertItem => {
			const currentPrice = num(a?.currentPrice);
			const target = num(a?.target);
			return {
				id: str(a?.id, 80),
				name: str(a?.name, 200) || 'Product',
				image: img(a?.image),
				query: str(a?.query, 120),
				target,
				startPrice: num(a?.startPrice) || currentPrice,
				currentPrice,
				storeName: str(a?.storeName, 60),
				createdAt: date(a?.createdAt),
				checkedAt: a?.checkedAt ? date(a.checkedAt) : null,
				checks: num(a?.checks),
				reached: Boolean(a?.reached),
				reachedAt: a?.reachedAt ? date(a.reachedAt) : null
			};
		})
	);
	const budgetMin = num(s.budgetMin);
	let budgetMax = num(s.budgetMax);
	if (budgetMax && budgetMax < budgetMin) budgetMax = budgetMin;
	return {
		version: 1,
		wishlist,
		history,
		alerts,
		settings: {
			budgetMin,
			budgetMax,
			hideOutsideBudget: Boolean(s.hideOutsideBudget),
			hiddenStores: arr(s.hiddenStores).filter((x) => typeof x === 'string').map((x: string) => x.slice(0, 40)).slice(0, 30)
		}
	};
}

/** Apply a refreshed price to an alert; "Reached!" when the price is at or below the target. */
export function applyPrice(a: AlertItem, price: number | null, at = new Date().toISOString()): AlertItem {
	if (price === null) return { ...a, checkedAt: at, checks: a.checks + 1 };
	const reached = price <= a.target;
	return { ...a, currentPrice: price, checkedAt: at, checks: a.checks + 1, reached: a.reached || reached, reachedAt: reached ? (a.reachedAt ?? at) : a.reachedAt };
}

export function backupFileName(d = new Date()): string {
	return `pricelens-backup-${d.toISOString().slice(0, 10)}.json`;
}
