// Pure pricing logic: price labels, sorting, filtering, budget checks and the
// plain-text share/comparison builders. Unit-tested in tests/unit/pricing.test.ts.
import type { Listing, PriceLabel, Product, Suggestion } from './types.ts';
import { inr } from './format.ts';

export type SortKey = 'price' | 'rating' | 'delivery';

export interface Filters {
	stores: string[]; // empty = all
	minPrice: number;
	maxPrice: number;
	minRating: number;
	brands: string[]; // empty = all
}

export interface Budget {
	min: number;
	max: number;
	hideOutside: boolean;
}

export function priceStats(listings: Listing[]) {
	if (listings.length === 0) return { min: 0, max: 0, avg: 0 };
	const prices = listings.map((l) => l.price);
	const min = Math.min(...prices);
	const max = Math.max(...prices);
	const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
	return { min, max, avg };
}

/** "Lowest price" for the cheapest, "Good deal" at or below the average, "Above average" otherwise. */
export function priceLabel(price: number, listings: Listing[]): PriceLabel {
	const { min, avg } = priceStats(listings);
	if (price <= min) return 'lowest';
	if (price <= avg) return 'good';
	return 'above';
}

export const LABEL_TEXT: Record<PriceLabel, string> = {
	lowest: 'Lowest price',
	good: 'Good deal',
	above: 'Above average'
};

export function sortListings(listings: Listing[], key: SortKey): Listing[] {
	const out = [...listings];
	if (key === 'price') out.sort((a, b) => a.price - b.price || b.rating - a.rating);
	else if (key === 'rating') out.sort((a, b) => b.rating - a.rating || a.price - b.price);
	else out.sort((a, b) => a.deliveryDays - b.deliveryDays || a.price - b.price);
	return out;
}

export function defaultFilters(listings: Listing[]): Filters {
	const { min, max } = priceStats(listings);
	return { stores: [], minPrice: Math.floor(min), maxPrice: Math.ceil(max), minRating: 0, brands: [] };
}

export function applyFilters(listings: Listing[], f: Filters, hiddenStores: string[] = []): Listing[] {
	return listings.filter(
		(l) =>
			!hiddenStores.includes(l.store) &&
			(f.stores.length === 0 || f.stores.includes(l.store)) &&
			l.price >= f.minPrice &&
			l.price <= f.maxPrice &&
			l.rating >= f.minRating &&
			(f.brands.length === 0 || f.brands.includes(l.brand))
	);
}

export type BudgetState = 'ok' | 'over' | 'under';

export function budgetState(price: number, b: Budget): BudgetState {
	if (b.max > 0 && price > b.max) return 'over';
	if (b.min > 0 && price < b.min) return 'under';
	return 'ok';
}

export function bestListing(listings: Listing[]): Listing | null {
	return listings.reduce<Listing | null>((best, l) => (!best || l.price < best.price || (l.price === best.price && l.rating > best.rating) ? l : best), null);
}

export function bestPrice(p: Product): number {
	return priceStats(p.listings).min;
}

export function savings(alt: Suggestion, reference: number): number {
	return Math.max(0, Math.round(reference - alt.price));
}

export function comparisonText(p: Product, listings: Listing[], link: string): string {
	const rows = sortListings(listings, 'price').map((l, i) => `${i + 1}. ${l.storeName} - ${inr(l.price)}${l.discountPct ? ` (${l.discountPct}% off)` : ''} - ${l.url}`);
	return [`PriceLens comparison: ${p.name}`, ...rows, '', 'Prices are indicative and may change on the store\'s site.', `Compared with PriceLens: ${link}`].join('\n');
}

export function shareMessage(p: Product, best: Listing | null, link: string): string {
	const price = best ? `${inr(best.price)} on ${best.storeName}` : 'compare prices';
	return `Found "${p.name}" for ${price} with PriceLens - Snap. Compare. Save. ${link}`;
}

export function whatsappUrl(message: string): string {
	return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
