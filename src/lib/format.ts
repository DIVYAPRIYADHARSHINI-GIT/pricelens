// Formatting helpers (Indian rupee, dates, slugs). Dependency-free, used client + server.

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export function inr(n: number | null | undefined): string {
	if (n === null || n === undefined || !Number.isFinite(n)) return '—';
	return INR.format(Math.round(n));
}

export function pct(n: number): string {
	return `${Math.round(n)}%`;
}

export function slug(s: string): string {
	return s
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60);
}

/** Small deterministic string hash (FNV-1a, 32-bit). */
export function hash(s: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return h >>> 0;
}

/** Deterministic pseudo-random generator (mulberry32). */
export function rng(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function isoDate(d: Date): string {
	return d.toISOString().slice(0, 10);
}

export function shortDate(iso: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function timeAgo(iso: string, now = Date.now()): string {
	const t = new Date(iso).getTime();
	if (Number.isNaN(t)) return '';
	const s = Math.max(0, Math.round((now - t) / 1000));
	if (s < 45) return 'just now';
	const m = Math.round(s / 60);
	if (m < 60) return `${m} min ago`;
	const h = Math.round(m / 60);
	if (h < 24) return `${h} h ago`;
	const d = Math.round(h / 24);
	if (d < 30) return `${d} d ago`;
	return shortDate(iso);
}

/** Round a price to a typical Indian retail ending (..9). */
export function retailRound(n: number): number {
	const r = Math.max(9, Math.round(n / 10) * 10 - 1);
	return r;
}

export function deliveryText(days: number): string {
	if (days >= 99) return 'Delivery: check store';
	if (days <= 1) return 'Tomorrow';
	if (days === 2) return 'In 2 days';
	return `In ${days} days`;
}
