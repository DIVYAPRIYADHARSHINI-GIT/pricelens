// Request guards for the API: image size/type limits and a tiny in-memory
// fixed-window rate limiter (per serverless instance - good enough for a demo).

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB after in-browser compression
export const MAX_BODY_BYTES = MAX_IMAGE_BYTES + 64 * 1024;
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_QUERY_LEN = 120;

/** Sniff magic bytes so a renamed file can't pass as an image. */
export function sniffImageType(b: Uint8Array): string | null {
	if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
	if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
	if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
	return null;
}

export class RateLimiter {
	private hits = new Map<string, { start: number; count: number }>();
	private limit: number;
	private windowMs: number;
	constructor(limit: number, windowMs = 60_000) {
		this.limit = limit;
		this.windowMs = windowMs;
	}

	/** Returns seconds to wait (0 = allowed). */
	check(key: string, now = Date.now()): number {
		if (this.hits.size > 5000) this.prune(now);
		const h = this.hits.get(key);
		if (!h || now - h.start >= this.windowMs) {
			this.hits.set(key, { start: now, count: 1 });
			return 0;
		}
		if (h.count >= this.limit) return Math.ceil((h.start + this.windowMs - now) / 1000);
		h.count++;
		return 0;
	}

	private prune(now: number) {
		for (const [k, v] of this.hits) if (now - v.start >= this.windowMs) this.hits.delete(k);
	}
}
