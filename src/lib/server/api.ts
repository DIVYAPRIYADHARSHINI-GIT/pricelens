// Shared helpers for the +server.ts routes: provider instance, JSON errors,
// rate limiting and parsing of the multipart search request.
import { env } from '$env/dynamic/private';
import { json, type RequestEvent } from '@sveltejs/kit';
import { CATEGORIES, type ApiError, type Category, type ImageFeatures, type SearchRequest } from '$lib/types.ts';
import { providerFromEnv } from './providers/index.ts';
import { ACCEPTED_TYPES, MAX_BODY_BYTES, MAX_IMAGE_BYTES, MAX_QUERY_LEN, RateLimiter, sniffImageType } from './limits.ts';

let cached: ReturnType<typeof providerFromEnv> | null = null;
export function provider() {
	cached ??= providerFromEnv(env);
	return cached;
}

const limiter = new RateLimiter(Math.max(1, Number(env.RATE_LIMIT_PER_MIN) || 60));

export function apiError(status: number, code: ApiError['code'], error: string, headers: Record<string, string> = {}) {
	return json({ ok: false, code, error } satisfies ApiError, { status, headers: { 'cache-control': 'no-store', ...headers } });
}

export function rateLimit(event: RequestEvent): Response | null {
	let ip = 'local';
	try {
		ip = event.getClientAddress();
	} catch {}
	const wait = limiter.check(ip);
	if (wait > 0) return apiError(429, 'rate-limited', `Too many searches - please wait ${wait}s and try again.`, { 'retry-after': String(wait) });
	return null;
}

function asCategory(v: unknown): Category | null {
	return typeof v === 'string' && (CATEGORIES as readonly string[]).includes(v) ? (v as Category) : null;
}

function asFeatures(v: unknown): ImageFeatures | undefined {
	if (!v || typeof v !== 'object') return undefined;
	const f = v as Record<string, unknown>;
	const n = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : 0);
	const palette = Array.isArray(f.palette)
		? f.palette.slice(0, 8).map((p: any) => ({ name: String(p?.name ?? '').slice(0, 12), hex: String(p?.hex ?? '').slice(0, 7), share: n(p?.share) }))
		: [];
	return { width: n(f.width), height: n(f.height), sharpness: n(f.sharpness), coverage: n(f.coverage), background: String(f.background ?? '').slice(0, 7), palette };
}

/** Parse multipart (photo) or JSON (text / category) search requests with size + type checks. */
export async function parseSearch(request: Request): Promise<SearchRequest | Response> {
	const len = Number(request.headers.get('content-length') ?? 0);
	if (len > MAX_BODY_BYTES) return apiError(413, 'too-large', 'That photo is too large. Please use an image under 2 MB.');
	const type = request.headers.get('content-type') ?? '';
	let req: SearchRequest = {};
	try {
		if (type.startsWith('multipart/form-data')) {
			const form = await request.formData();
			const file = form.get('image');
			if (file && typeof file !== 'string') {
				if (file.size > MAX_IMAGE_BYTES) return apiError(413, 'too-large', 'That photo is too large. Please use an image under 2 MB.');
				if (!ACCEPTED_TYPES.includes(file.type)) return apiError(415, 'unsupported', 'Unsupported file type. Please use a JPG, PNG or WebP photo.');
				// Processed in memory only - never written to disk or storage.
				const bytes = new Uint8Array(await file.arrayBuffer());
				if (!sniffImageType(bytes)) return apiError(415, 'unsupported', "That file doesn't look like a photo. Please use a JPG, PNG or WebP image.");
				req.image = { bytes, type: file.type };
			}
			const meta = form.get('meta');
			if (typeof meta === 'string' && meta.length < 8000) {
				const m = JSON.parse(meta);
				req = { ...req, ...pickFields(m) };
			}
		} else if (type.includes('application/json')) {
			const text = await request.text();
			if (text.length > 8000) return apiError(413, 'too-large', 'Request too large.');
			req = pickFields(JSON.parse(text));
		} else {
			return apiError(415, 'unsupported', 'Send multipart/form-data or JSON.');
		}
	} catch {
		return apiError(400, 'bad-request', 'Could not read the request. Please try again.');
	}
	if (!req.image && !req.query && !req.category && !req.productId && !req.features) {
		return apiError(400, 'bad-request', 'Add a photo, pick a category or type what you are looking for.');
	}
	return req;
}

function pickFields(m: any): SearchRequest {
	const query = typeof m?.query === 'string' ? m.query.replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY_LEN) : undefined;
	const productId = typeof m?.productId === 'string' && /^[a-z0-9-]{1,80}$/.test(m.productId) ? m.productId : undefined;
	const fileName = typeof m?.fileName === 'string' ? m.fileName.slice(0, 120) : undefined;
	return { query: query || undefined, category: asCategory(m?.category), productId, fileName, features: asFeatures(m?.features) };
}
