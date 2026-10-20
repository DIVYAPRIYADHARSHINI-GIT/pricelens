// POST /api/prices - refresh best prices for saved alerts / wishlist items.
// Body: { items: [{ id, query?, tick? }] } (max 20). Rate limited.
import { json } from '@sveltejs/kit';
import { apiError, provider, rateLimit } from '$lib/server/api.ts';
import { mockProvider } from '$lib/server/providers/index.ts';
import type { PriceCheckItem } from '$lib/server/providers/types.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const limited = rateLimit(event);
	if (limited) return limited;
	let items: PriceCheckItem[] = [];
	try {
		const text = await event.request.text();
		if (text.length > 16000) return apiError(413, 'too-large', 'Request too large.');
		const body = JSON.parse(text);
		items = (Array.isArray(body?.items) ? body.items : [])
			.slice(0, 20)
			.filter((i: any) => typeof i?.id === 'string' && /^[a-z0-9-]{1,80}$/.test(i.id))
			.map((i: any) => ({ id: i.id, query: typeof i.query === 'string' ? i.query.slice(0, 120) : undefined, tick: Number.isFinite(i.tick) ? Math.max(0, Math.floor(i.tick)) : 0 }));
	} catch {
		return apiError(400, 'bad-request', 'Could not read the request.');
	}
	try {
		const demo = items.filter((i) => !i.id.startsWith('live-'));
		const live = items.filter((i) => i.id.startsWith('live-'));
		const p = provider();
		const results = [...(await mockProvider.prices(demo)), ...(live.length && p.name === 'real' ? await p.prices(live) : live.map((i) => ({ id: i.id, price: null })))];
		return json({ ok: true, results, checkedAt: new Date().toISOString() }, { headers: { 'cache-control': 'no-store' } });
	} catch {
		return apiError(502, 'server', 'Could not refresh prices right now.');
	}
};
