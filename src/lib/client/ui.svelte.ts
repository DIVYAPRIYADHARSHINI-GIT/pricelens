// App-wide UI state: toasts, confirmation dialog, theme, online status.
// Plain methods only (no $effect writing state) so nothing can loop.

export type Tone = 'ok' | 'err' | 'info';
interface Toast {
	id: number;
	text: string;
	tone: Tone;
}
interface ConfirmState {
	title: string;
	message: string;
	confirmLabel: string;
	danger: boolean;
	resolve: (ok: boolean) => void;
}

export const THEME_KEY = 'pricelens.theme';

class UI {
	toasts = $state<Toast[]>([]);
	confirm = $state<ConfirmState | null>(null);
	theme = $state<'light' | 'dark'>('light');
	online = $state(true);
	/** 'demo' = MockProvider sample data (shows the "Demo mode" badge). */
	mode = $state<'demo' | 'live'>('demo');
	#seq = 0;

	toast(text: string, tone: Tone = 'ok') {
		const id = ++this.#seq;
		this.toasts = [...this.toasts.slice(-2), { id, text, tone }];
		setTimeout(() => this.dismiss(id), tone === 'err' ? 6000 : 3200);
	}
	dismiss(id: number) {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}

	ask(opts: { title: string; message: string; confirmLabel?: string; danger?: boolean }): Promise<boolean> {
		this.confirm?.resolve(false);
		return new Promise((resolve) => {
			this.confirm = { confirmLabel: 'Delete', danger: true, ...opts, resolve };
		});
	}
	answer(ok: boolean) {
		const c = this.confirm;
		this.confirm = null;
		c?.resolve(ok);
	}

	initTheme() {
		this.theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
		this.online = navigator.onLine !== false;
	}
	setTheme(t: 'light' | 'dark') {
		this.theme = t;
		document.documentElement.dataset.theme = t;
		try {
			localStorage.setItem(THEME_KEY, t);
		} catch {}
	}
	toggleTheme() {
		this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
	}
}

export const ui = new UI();

/** Copy text; falls back to a hidden textarea when the async clipboard is unavailable. */
export async function copyText(text: string): Promise<boolean> {
	try {
		if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(text);
			return true;
		}
	} catch {}
	try {
		const ta = document.createElement('textarea');
		ta.value = text;
		ta.setAttribute('readonly', '');
		ta.style.position = 'fixed';
		ta.style.opacity = '0';
		document.body.appendChild(ta);
		ta.select();
		const ok = document.execCommand('copy');
		ta.remove();
		return ok;
	} catch {
		return false;
	}
}

export function download(name: string, text: string, type = 'application/json') {
	const url = URL.createObjectURL(new Blob([text], { type }));
	const a = document.createElement('a');
	a.href = url;
	a.download = name;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
