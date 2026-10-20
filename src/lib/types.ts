// Shared types for PriceLens (client + server). Keep this file dependency-free.

export const CATEGORIES = ['dress', 'shirt', 'shoes', 'bag', 'watch', 'phone', 'headphones', 'other'] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
	dress: 'Dress',
	shirt: 'Shirt',
	shoes: 'Shoes',
	bag: 'Bag',
	watch: 'Watch',
	phone: 'Phone',
	headphones: 'Headphones',
	other: 'Other'
};

export type PriceLabel = 'lowest' | 'good' | 'above';

export interface Listing {
	id: string;
	/** Store id from $lib/stores.ts for known stores, otherwise a slug of the store name. */
	store: string;
	storeName: string;
	title: string;
	brand: string;
	price: number;
	/** Original / MRP price (0 when unknown). */
	mrp: number;
	discountPct: number;
	rating: number;
	ratingCount: number;
	/** Delivery estimate in days (99 when unknown). */
	deliveryDays: number;
	deliveryText: string;
	url: string;
	inStock: boolean;
}

export interface PricePoint {
	date: string; // YYYY-MM-DD
	price: number;
}

export interface ColourOption {
	name: string;
	hex: string;
}

export interface Product {
	id: string;
	name: string;
	brand: string;
	category: Category;
	description: string;
	images: string[];
	colours: ColourOption[];
	sizes: string[];
	listings: Listing[];
	priceHistory: PricePoint[];
	/** Live products only exist in the client cache; demo products can be re-fetched by id. */
	source: 'demo' | 'live';
}

export interface Suggestion {
	id: string;
	name: string;
	brand: string;
	category: Category;
	image: string;
	price: number;
	mrp: number;
	rating: number;
	store: string;
	storeName: string;
	url: string;
	/** True when /product/[id] can show full details (demo catalog). */
	hasDetail: boolean;
}

export type DetectReason = 'blurry' | 'low-confidence' | 'no-product';

export interface Detection {
	label: string;
	category: Category | null;
	confidence: number; // 0..1
	uncertain: boolean;
	reason?: DetectReason;
	method: 'colour' | 'filename' | 'text' | 'category' | 'vision';
	colour?: { name: string; hex: string };
}

/** Features computed in the browser while resizing (no pixels leave the device for demo matching). */
export interface ImageFeatures {
	width: number;
	height: number;
	/** Laplacian variance of a 256px greyscale copy - low = blurry. */
	sharpness: number;
	/** Fraction of the centre region that differs from the border/background colour. */
	coverage: number;
	/** Background colour estimated from the border ring. */
	background: string;
	/** Top colour classes of the centre region (background removed), share 0..1. */
	palette: { name: string; hex: string; share: number }[];
}

export interface SearchRequest {
	query?: string;
	category?: Category | null;
	/** Re-run a known demo product (history re-run / shared links). */
	productId?: string;
	fileName?: string;
	features?: ImageFeatures;
	/** Raw image bytes (only forwarded to a real vision API; never stored). */
	image?: { bytes: Uint8Array; type: string } | null;
}

export interface SearchResponse {
	ok: true;
	mode: 'demo' | 'live';
	query: string;
	notice?: string;
	detected: Detection;
	product: Product | null;
	similar: Suggestion[];
	cheaper: Suggestion[];
}

export interface ApiError {
	ok: false;
	error: string;
	code: 'too-large' | 'unsupported' | 'rate-limited' | 'bad-request' | 'not-found' | 'server';
}

export interface PriceCheck {
	id: string;
	price: number | null;
	storeName?: string;
}
