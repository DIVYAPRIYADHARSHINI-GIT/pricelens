// GET /api/health - liveness + which provider is active (never exposes keys).
import { json } from '@sveltejs/kit';
import { provider } from '$lib/server/api.ts';
import { MAX_IMAGE_BYTES, ACCEPTED_TYPES } from '$lib/server/limits.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () =>
	json(
		{ ok: true, app: 'PriceLens', mode: provider().name === 'real' ? 'live' : 'demo', limits: { maxImageBytes: MAX_IMAGE_BYTES, acceptedTypes: ACCEPTED_TYPES } },
		{ headers: { 'cache-control': 'no-store' } }
	);
