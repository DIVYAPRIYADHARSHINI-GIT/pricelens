// POST /api/search - photo (multipart: image + meta JSON) or text/category (JSON).
// Size/type limited and rate limited; the image is processed in memory and dropped.
import { json } from '@sveltejs/kit';
import { apiError, parseSearch, provider, rateLimit } from '$lib/server/api.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const limited = rateLimit(event);
	if (limited) return limited;
	const req = await parseSearch(event.request);
	if (req instanceof Response) return req;
	try {
		const res = await provider().search(req);
		return json(res, { headers: { 'cache-control': 'no-store' } });
	} catch (e) {
		console.warn('search failed:', (e as Error)?.message);
		return apiError(502, 'server', 'The price service did not answer. Please try again in a moment.');
	} finally {
		req.image = null; // drop the photo bytes right away
	}
};
