<script lang="ts">
	// Editorial type: Bodoni Moda (Didone display serif) + Jost (geometric sans UI).
	import '@fontsource/bodoni-moda/400.css';
	import '@fontsource/bodoni-moda/500.css';
	import '@fontsource/bodoni-moda/400-italic.css';
	import '@fontsource/jost/400.css';
	import '@fontsource/jost/500.css';
	import '../app.css';
	import { onMount } from 'svelte';
	import Nav from '$lib/components/Nav.svelte';
	import Toasts from '$lib/components/Toasts.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { store, STORAGE_KEY } from '$lib/client/store.svelte.ts';
	import { THEME_KEY, ui } from '$lib/client/ui.svelte.ts';
	import { search } from '$lib/client/search.svelte.ts';

	let { children } = $props();

	onMount(() => {
		ui.initTheme();
		store.load();
		search.restore();
		document.getElementById('boot-loader')?.remove();
		// Which provider is active (demo badge). Never blocks the UI.
		const ctrl = new AbortController();
		const t = setTimeout(() => ctrl.abort(), 6000);
		fetch('/api/health', { signal: ctrl.signal })
			.then((r) => r.json())
			.then((j) => {
				if (j?.mode === 'live' || j?.mode === 'demo') ui.mode = j.mode;
			})
			.catch(() => {})
			.finally(() => clearTimeout(t));

		const onStorage = (e: StorageEvent) => {
			if (e.key === STORAGE_KEY) store.reloadFromStorage(e.newValue);
			if (e.key === THEME_KEY && (e.newValue === 'dark' || e.newValue === 'light')) ui.setTheme(e.newValue);
		};
		const onOnline = () => (ui.online = true);
		const onOffline = () => (ui.online = false);
		window.addEventListener('storage', onStorage);
		window.addEventListener('online', onOnline);
		window.addEventListener('offline', onOffline);
		return () => {
			ctrl.abort();
			window.removeEventListener('storage', onStorage);
			window.removeEventListener('online', onOnline);
			window.removeEventListener('offline', onOffline);
		};
	});
</script>

<a class="skip" href="#main">Skip to content</a>
<div class="shell">
	<Nav />
	<div class="main-col">
		{#if !ui.online}
			<div class="offline" role="status" data-testid="offline-banner">
				<Icon name="wifiOff" size={18} />
				<span>You're offline. Saved items still work - searching needs internet.</span>
			</div>
		{/if}
		<main id="main" tabindex="-1">
			{#if store.ready}
				{@render children()}
			{:else}
				<div class="page" data-testid="loading" aria-busy="true">
					<div class="skeleton" style="height:64px;width:min(460px,80%)"></div>
					<div class="skeleton" style="height:220px"></div>
					<div class="skeleton" style="height:180px"></div>
				</div>
			{/if}
		</main>
	</div>
</div>
<footer class="foot" aria-label="About PriceLens">
	<span class="fwm">PriceLens</span>
	<span class="kicker">Snap · Compare · Save</span>
	<span class="muted small">Prices are indicative and may change on the store's site.</span>
</footer>
<Toasts />
<ConfirmDialog />

<style>
	.skip {
		position: absolute;
		left: -999px;
		top: 8px;
		z-index: 100;
		padding: 12px 18px;
		font: 500 0.75rem/1 var(--sans);
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--on-ink);
		background: var(--ink);
	}
	.skip:focus {
		left: 8px;
	}
	.shell {
		min-height: 100vh;
	}
	.main-col {
		min-width: 0;
	}
	main:focus {
		outline: none;
	}
	.offline {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 10px 16px;
		font: 500 0.74rem/1.3 var(--sans);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--on-ink);
		background: var(--sale);
	}
	.foot {
		display: none;
	}
	@media (min-width: 900px) {
		.foot {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 8px;
			padding: 40px 24px 48px;
			border-top: 1px solid var(--hair);
			text-align: center;
		}
		.fwm {
			font-family: var(--serif);
			font-size: 2.4rem;
			line-height: 1;
		}
		.small {
			font-size: 0.85rem;
		}
	}
</style>
