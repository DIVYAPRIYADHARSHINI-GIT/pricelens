// GET /api/product/:id - full product (listings, gallery, history) + suggestions.
// Demo catalog products always resolve (also in live mode, for shared demo links).
import { json } from '@sveltejs/kit';
import { apiError, provider } from '$lib/server/api.ts';
import { mockProvider } from '$lib/server/providers/index.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const id = params.id;
	if (!/^[a-z0-9-]{1,80}$/.test(id)) return apiError(400, 'bad-request', 'Invalid product id.');
	const found = (await provider().product(id)) ?? (await mockProvider.product(id));
	if (!found) return apiError(404, 'not-found', 'Product not found.');
	return json({ ok: true, mode: found.product.source === 'live' ? 'live' : 'demo', ...found }, { headers: { 'cache-control': 'no-store' } });
};
