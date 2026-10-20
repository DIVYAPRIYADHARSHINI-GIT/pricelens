<script lang="ts">
	import '@fontsource/space-grotesk/400.css';
	import '@fontsource/space-grotesk/500.css';
	import '@fontsource/space-grotesk/700.css';
	import '@fontsource/space-mono/400.css';
	import '@fontsource/space-mono/700.css';
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
				<Icon name="wifiOff" size={20} />
				<span>You're offline. Saved items still work - searching needs internet.</span>
			</div>
		{/if}
		<main id="main" tabindex="-1">
			{#if store.ready}
				{@render children()}
			{:else}
				<div class="page" data-testid="loading" aria-busy="true">
					<div class="skeleton" style="height:56px;width:min(420px,80%)"></div>
					<div class="skeleton" style="height:160px"></div>
					<div class="skeleton" style="height:220px"></div>
				</div>
			{/if}
		</main>
	</div>
</div>
<Toasts />
<ConfirmDialog />

<style>
	.skip {
		position: absolute;
		left: -999px;
		top: 8px;
		z-index: 100;
		padding: 10px 16px;
		font-weight: 700;
		color: #111;
		background: var(--yellow);
		border: var(--bw) solid var(--line);
		border-radius: 12px;
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
		gap: 10px;
		padding: 10px 16px;
		font-weight: 700;
		color: #111;
		background: var(--orange);
		border-bottom: var(--bw) solid var(--line);
	}
	@media (min-width: 900px) {
		.shell {
			display: flex;
		}
		.main-col {
			flex: 1;
		}
	}
</style>
