// The current search session: scan/upload -> /api/search -> results.
// Lives in memory + sessionStorage (so a reload keeps the last result); photos
// are compressed in the browser and never stored on the server.
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import type { ApiError, Category, Product, SearchResponse } from '../types.ts';
import { CATEGORY_LABEL } from '../types.ts';
import { bestListing } from '../pricing.ts';
import { ImageError, processImage } from './image.ts';
import { store } from './store.svelte.ts';
import { ui } from './ui.svelte.ts';

export type Phase = 'idle' | 'processing' | 'searching' | 'done' | 'uncertain' | 'error';
export type ErrorKind = 'offline' | 'unsupported' | 'too-large' | 'server' | 'rate-limited' | 'camera';

export interface SessionError {
	kind: ErrorKind;
	message: string;
}

const SESSION_KEY = 'pricelens.session';
const LIVE_KEY = 'pricelens.liveProducts';
const TIMEOUT_MS = 15000;

const MESSAGES = ['Looking closely at your photo…', 'Checking Amazon, Flipkart, Myntra…', 'Hunting for the cheapest price…', 'Almost there - comparing stores…'];

interface Source {
	kind: 'photo' | 'text' | 'category';
	image: string | null; // preview data URL (photo) or product art
	thumb: string;
	fileName: string;
	blob: Blob | null;
	features: unknown;
}

class SearchSession {
	phase = $state<Phase>('idle');
	message = $state(MESSAGES[0]);
	error = $state<SessionError | null>(null);
	result = $state<SearchResponse | null>(null);
	preview = $state<string | null>(null);
	query = $state('');
	#source: Source | null = null;
	#msgTimer: ReturnType<typeof setInterval> | null = null;
	#seq = 0;
	#restored = false;

	restore() {
		if (!browser || this.#restored) return;
		this.#restored = true;
		try {
			const raw = sessionStorage.getItem(SESSION_KEY);
			if (!raw) return;
			const s = JSON.parse(raw);
			if (s?.result?.ok) {
				this.result = s.result;
				this.preview = s.preview ?? null;
				this.query = s.query ?? '';
				this.phase = s.result.product ? 'done' : 'uncertain';
				if (s.result.product?.source === 'live') cacheLive(s.result.product);
			}
		} catch {}
	}

	#persist() {
		try {
			sessionStorage.setItem(SESSION_KEY, JSON.stringify({ result: $state.snapshot(this.result), preview: this.preview, query: this.query }));
		} catch {
			try {
				sessionStorage.setItem(SESSION_KEY, JSON.stringify({ result: $state.snapshot(this.result), preview: null, query: this.query }));
			} catch {}
		}
	}

	#startMessages() {
		this.#stopMessages();
		let i = 0;
		this.message = MESSAGES[0];
		this.#msgTimer = setInterval(() => {
			i = (i + 1) % MESSAGES.length;
			this.message = MESSAGES[i];
		}, 1400);
	}
	#stopMessages() {
		if (this.#msgTimer) clearInterval(this.#msgTimer);
		this.#msgTimer = null;
	}

	fail(kind: ErrorKind, message: string) {
		this.#stopMessages();
		this.error = { kind, message };
		this.phase = 'error';
	}

	reset() {
		this.#seq++;
		this.#stopMessages();
		this.phase = 'idle';
		this.error = null;
	}

	/** Photo from camera / upload / drag-and-drop. */
	async fromFile(file: File) {
		const seq = ++this.#seq;
		this.error = null;
		this.phase = 'processing';
		this.preview = null;
		this.#startMessages();
		void goto('/results');
		try {
			const img = await processImage(file, file.name || 'photo.jpg');
			if (seq !== this.#seq) return;
			this.preview = img.preview;
			this.query = '';
			this.#source = { kind: 'photo', image: img.preview, thumb: img.thumb, fileName: img.name, blob: img.blob, features: img.features };
			await this.#send({ fileName: img.name, features: img.features }, img.blob, seq);
		} catch (e) {
			if (seq !== this.#seq) return;
			if (e instanceof ImageError) this.fail(e.code === 'too-large' ? 'too-large' : 'unsupported', e.message);
			else this.fail('unsupported', "We couldn't read that photo. Please try another one.");
		}
	}

	/** Typed text, optionally with a category (also used by the "Not sure" screen). */
	async fromText(query: string, category: Category | null = null) {
		const q = query.trim();
		if (!q && !category) return;
		const seq = ++this.#seq;
		this.error = null;
		this.phase = 'searching';
		this.#startMessages();
		this.query = q || (category ? CATEGORY_LABEL[category] : '');
		this.preview = null;
		this.#source = { kind: q ? 'text' : 'category', image: null, thumb: '', fileName: '', blob: null, features: null };
		void goto('/results');
		await this.#send({ query: q || undefined, category: category ?? undefined }, null, seq);
	}

	/** Correction from the "Not sure what this is?" screen or the edit button - keeps the photo. */
	async correct(query: string, category: Category | null) {
		const q = query.trim();
		if (!q && !category) return;
		const seq = ++this.#seq;
		this.error = null;
		this.phase = 'searching';
		this.#startMessages();
		this.query = q || (category ? CATEGORY_LABEL[category] : '');
		if (this.#source) this.#source = { ...this.#source, blob: null, features: null };
		else this.#source = { kind: q ? 'text' : 'category', image: null, thumb: '', fileName: '', blob: null, features: null };
		await this.#send({ query: q || undefined, category: category ?? undefined }, null, seq);
	}

	/** Re-run a history entry. */
	async rerun(h: { query: string; productId: string | null; category: Category | null; thumb: string; kind: 'photo' | 'text' | 'category' }) {
		const seq = ++this.#seq;
		this.error = null;
		this.phase = 'searching';
		this.#startMessages();
		this.preview = h.kind === 'photo' ? h.thumb || null : null;
		this.query = h.query;
		this.#source = { kind: h.kind, image: this.preview, thumb: h.thumb, fileName: '', blob: null, features: null };
		void goto('/results');
		await this.#send({ productId: h.productId ?? undefined, query: h.productId ? undefined : h.query || undefined, category: h.category ?? undefined }, null, seq);
	}

	retry() {
		const s = this.#source;
		if (s?.blob) {
			const seq = ++this.#seq;
			this.error = null;
			this.phase = 'searching';
			this.#startMessages();
			void this.#send({ fileName: s.fileName, features: s.features }, s.blob, seq);
		} else if (this.query) {
			void this.fromText(this.query);
		} else {
			this.reset();
			void goto('/');
		}
	}

	async #send(meta: Record<string, unknown>, blob: Blob | null, seq: number) {
		if (browser && navigator.onLine === false) {
			this.fail('offline', "You're offline. Check your internet connection and try again.");
			return;
		}
		this.phase = 'searching';
		const ctrl = new AbortController();
		const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
		try {
			let body: BodyInit;
			const headers: Record<string, string> = {};
			if (blob) {
				const form = new FormData();
				form.append('image', blob, 'photo.jpg');
				form.append('meta', JSON.stringify(meta));
				body = form;
			} else {
				headers['content-type'] = 'application/json';
				body = JSON.stringify(meta);
			}
			const r = await fetch('/api/search', { method: 'POST', body, headers, signal: ctrl.signal });
			const j = (await r.json().catch(() => null)) as SearchResponse | ApiError | null;
			if (seq !== this.#seq) return;
			if (!j || !j.ok) {
				const err = j as ApiError | null;
				const kind: ErrorKind = err?.code === 'too-large' ? 'too-large' : err?.code === 'unsupported' ? 'unsupported' : err?.code === 'rate-limited' ? 'rate-limited' : 'server';
				this.fail(kind, err?.error ?? 'Something went wrong. Please try again.');
				return;
			}
			this.#stopMessages();
			this.result = j;
			this.error = null;
			if (j.product?.source === 'live') cacheLive(j.product);
			if (j.product) {
				this.phase = 'done';
				const best = bestListing(j.product.listings);
				const s = this.#source;
				store.addHistory({
					thumb: s?.kind === 'photo' ? s.thumb : '',
					label: j.product.name,
					category: j.product.category,
					query: this.query || j.query,
					productId: j.product.source === 'demo' ? j.product.id : null,
					bestPrice: best?.price ?? null,
					kind: s?.kind ?? 'text',
					mode: j.mode
				});
			} else {
				this.phase = 'uncertain';
			}
			this.#persist();
		} catch (e) {
			if (seq !== this.#seq) return;
			const aborted = (e as Error)?.name === 'AbortError';
			if (browser && navigator.onLine === false) this.fail('offline', "You're offline. Check your internet connection and try again.");
			else this.fail(aborted ? 'server' : 'offline', aborted ? 'The search took too long. Please try again.' : "Couldn't reach PriceLens. Check your connection and try again.");
		} finally {
			clearTimeout(timer);
		}
	}

	/** Called when a product page updates the current product (keeps results in sync). */
	get product(): Product | null {
		return this.result?.product ?? null;
	}

	toastMode() {
		if (this.result?.notice) ui.toast(this.result.notice, 'info');
	}
}

export const search = new SearchSession();

/** Live (RealProvider) products only exist client-side - cache them for /product/[id]. */
export function cacheLive(p: Product) {
	try {
		const raw = sessionStorage.getItem(LIVE_KEY);
		const map = raw ? JSON.parse(raw) : {};
		map[p.id] = p;
		const keys = Object.keys(map);
		if (keys.length > 10) delete map[keys[0]];
		sessionStorage.setItem(LIVE_KEY, JSON.stringify(map));
	} catch {}
}

export function cachedLive(id: string): Product | null {
	try {
		const raw = sessionStorage.getItem(LIVE_KEY);
		return raw ? (JSON.parse(raw)[id] ?? null) : null;
	} catch {
		return null;
	}
}
