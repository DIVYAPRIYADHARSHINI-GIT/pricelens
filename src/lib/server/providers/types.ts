// Provider interface: every data source (demo or live) implements this. The API
// routes only talk to `getProvider()` (see ./index.ts), so keys stay on the server.
import type { PriceCheck, Product, SearchRequest, SearchResponse, Suggestion } from '../../types.ts';

export interface PriceCheckItem {
	id: string;
	/** Search text used by live providers to re-check a product's price. */
	query?: string;
	/** Demo only: refresh counter, drives the simulated price change. */
	tick?: number;
}

export interface Provider {
	readonly name: 'mock' | 'real';
	search(req: SearchRequest): Promise<SearchResponse>;
	/** Full product + suggestions for /product/[id] (null when the id is unknown to this provider). */
	product(id: string): Promise<{ product: Product; similar: Suggestion[]; cheaper: Suggestion[] } | null>;
	prices(items: PriceCheckItem[]): Promise<PriceCheck[]>;
}
