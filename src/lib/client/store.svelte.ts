// Persistent app data (wishlist, history, alerts, settings) in localStorage.
// Plain methods mutate state then call save(); no $effect writes state, so no loops.
import { browser } from '$app/environment';
import type { Category, Listing, Product } from '../types.ts';
import { bestListing } from '../pricing.ts';
import { applyPrice, emptyData, MAX_HISTORY, normalizeData, type AlertItem, type AppData, type HistoryItem, type Settings, type WishItem } from './backup.ts';

export const STORAGE_KEY = 'pricelens.v1';
const TICK_KEY = 'pricelens.tick';

class Store {
	data = $state<AppData>(emptyData());
	ready = $state(false);
	storageOk = $state(true);

	load() {
		if (!browser) return;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			this.data = raw ? normalizeData(JSON.parse(raw)) : emptyData();
		} catch {
			this.data = emptyData();
		}
		this.ready = true;
	}

	reloadFromStorage(raw: string | null) {
		try {
			this.data = raw ? normalizeData(JSON.parse(raw)) : emptyData();
		} catch {
			/* ignore broken value from another tab */
		}
	}

	save() {
		if (!browser) return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify($state.snapshot(this.data)));
			this.storageOk = true;
		} catch {
			// Quota full (big thumbnails): drop the oldest history thumbnails and retry once.
			try {
				this.data.history = this.data.history.slice(0, 10).map((h, i) => (i > 4 ? { ...h, thumb: '' } : h));
				localStorage.setItem(STORAGE_KEY, JSON.stringify($state.snapshot(this.data)));
			} catch {
				this.storageOk = false;
			}
		}
	}

	get settings(): Settings {
		return this.data.settings;
	}

	updateSettings(patch: Partial<Settings>) {
		this.data.settings = { ...this.data.settings, ...patch };
		this.save();
	}

	toggleStore(id: string) {
		const hidden = this.data.settings.hiddenStores;
		this.updateSettings({ hiddenStores: hidden.includes(id) ? hidden.filter((s) => s !== id) : [...hidden, id] });
	}

	// ---- wishlist
	isSaved(id: string) {
		return this.data.wishlist.some((w) => w.id === id);
	}

	toggleWish(p: Product, query: string): boolean {
		if (this.isSaved(p.id)) {
			this.removeWish(p.id);
			return false;
		}
		const best = bestListing(p.listings);
		const item: WishItem = {
			id: p.id,
			name: p.name,
			image: p.images[0] ?? '',
			category: p.category,
			price: best?.price ?? 0,
			storeName: best?.storeName ?? '',
			url: best?.url ?? '',
			query: query || p.name,
			source: p.source,
			savedAt: new Date().toISOString()
		};
		this.data.wishlist = [item, ...this.data.wishlist];
		this.save();
		return true;
	}

	removeWish(id: string) {
		this.data.wishlist = this.data.wishlist.filter((w) => w.id !== id);
		this.save();
	}

	// ---- history
	addHistory(h: Omit<HistoryItem, 'id' | 'at'>) {
		const item: HistoryItem = { ...h, id: `h-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString() };
		// Collapse an identical consecutive search instead of stacking duplicates.
		const rest = this.data.history.filter((x, i) => !(i === 0 && x.query === item.query && x.productId === item.productId && x.kind === item.kind && x.kind !== 'photo'));
		this.data.history = [item, ...rest].slice(0, MAX_HISTORY);
		this.save();
		return item;
	}

	removeHistory(id: string) {
		this.data.history = this.data.history.filter((h) => h.id !== id);
		this.save();
	}

	clearHistory() {
		this.data.history = [];
		this.save();
	}

	// ---- alerts
	alertFor(id: string): AlertItem | undefined {
		return this.data.alerts.find((a) => a.id === id);
	}

	setAlert(p: Product, target: number, query: string) {
		const best = bestListing(p.listings);
		const price = best?.price ?? 0;
		const existing = this.alertFor(p.id);
		const base: AlertItem = existing
			? { ...existing, target, reached: false, reachedAt: null }
			: {
					id: p.id,
					name: p.name,
					image: p.images[0] ?? '',
					query: query || p.name,
					target,
					startPrice: price,
					currentPrice: price,
					storeName: best?.storeName ?? '',
					createdAt: new Date().toISOString(),
					checkedAt: null,
					checks: 0,
					reached: false,
					reachedAt: null
				};
		const item = price > 0 && price <= target ? { ...base, reached: true, reachedAt: new Date().toISOString() } : base;
		this.data.alerts = [item, ...this.data.alerts.filter((a) => a.id !== p.id)];
		this.save();
		return item;
	}

	removeAlert(id: string) {
		this.data.alerts = this.data.alerts.filter((a) => a.id !== id);
		this.save();
	}

	/** Refresh alert prices through /api/prices. Returns how many alerts are newly reached. */
	async refreshAlerts(): Promise<number> {
		const alerts = this.data.alerts;
		if (alerts.length === 0) return 0;
		let tick = 1;
		try {
			tick = Number(localStorage.getItem(TICK_KEY) ?? 0) + 1;
			localStorage.setItem(TICK_KEY, String(tick));
		} catch {}
		const ctrl = new AbortController();
		const timer = setTimeout(() => ctrl.abort(), 10000);
		try {
			const r = await fetch('/api/prices', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ items: alerts.map((a) => ({ id: a.id, query: a.query, tick })) }),
				signal: ctrl.signal
			});
			const j = await r.json();
			if (!r.ok || !j.ok) throw new Error(j.error ?? 'Could not refresh prices');
			const byId = new Map<string, { price: number | null; storeName?: string }>(j.results.map((x: any) => [x.id, x]));
			let newly = 0;
			this.data.alerts = this.data.alerts.map((a) => {
				const res = byId.get(a.id);
				if (!res) return a;
				const next = applyPrice({ ...a, storeName: res.storeName ?? a.storeName }, res.price, j.checkedAt);
				if (next.reached && !a.reached) newly++;
				return next;
			});
			this.save();
			return newly;
		} finally {
			clearTimeout(timer);
		}
	}

	// ---- backup
	exportJson(): string {
		return JSON.stringify({ app: 'PriceLens', exportedAt: new Date().toISOString(), ...$state.snapshot(this.data) }, null, 2);
	}

	/** Parse + validate a backup file (throws a friendly error) without changing anything. */
	parseBackup(text: string): AppData {
		let parsed: unknown;
		try {
			parsed = JSON.parse(text);
		} catch {
			throw new Error("That file isn't valid JSON.");
		}
		if (!parsed || typeof parsed !== 'object' || (!('wishlist' in parsed) && !('history' in parsed) && !('alerts' in parsed) && !('settings' in parsed))) {
			throw new Error("That file isn't a PriceLens backup.");
		}
		return normalizeData(parsed);
	}

	importData(data: AppData): { wishlist: number; history: number; alerts: number } {
		this.data = data;
		this.save();
		return { wishlist: data.wishlist.length, history: data.history.length, alerts: data.alerts.length };
	}

	/** "Start fresh": clears history, wishlist and alerts (keeps budget + store settings). */
	startFresh() {
		this.data = { ...emptyData(), settings: this.data.settings };
		try {
			localStorage.removeItem(TICK_KEY);
			sessionStorage.removeItem('pricelens.session');
			sessionStorage.removeItem('pricelens.liveProducts');
		} catch {}
		this.save();
	}
}

export const store = new Store();

export function listingOutsideBudget(l: Listing, s: Settings): boolean {
	return (s.budgetMax > 0 && l.price > s.budgetMax) || (s.budgetMin > 0 && l.price < s.budgetMin);
}

export type { Category };
