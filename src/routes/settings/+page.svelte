<script lang="ts">
	// Settings: budget, store preferences, theme, data source, JSON backup, Start fresh, privacy.
	import { store } from '$lib/client/store.svelte.ts';
	import { download, ui } from '$lib/client/ui.svelte.ts';
	import { backupFileName } from '$lib/client/backup.ts';
	import { STORES } from '$lib/stores.ts';
	import { inr } from '$lib/format.ts';
	import StoreBadge from '$lib/components/StoreBadge.svelte';
	import ModeBadge from '$lib/components/ModeBadge.svelte';
	import Icon from '$lib/components/Icon.svelte';

	const s = $derived(store.data.settings);
	// Local inputs, copied once from saved settings. (Number inputs bind numbers or null.)
	// svelte-ignore state_referenced_locally
	let minIn = $state<number | string | null>(store.data.settings.budgetMin || null);
	// svelte-ignore state_referenced_locally
	let maxIn = $state<number | string | null>(store.data.settings.budgetMax || null);
	let budgetErr = $state('');
	let fileInput: HTMLInputElement | undefined = $state();

	const parse = (v: number | string | null) => (v === null || String(v).trim() === '' ? 0 : Math.round(Number(v)));

	function saveBudget(e: SubmitEvent) {
		e.preventDefault();
		const min = parse(minIn);
		const max = parse(maxIn);
		if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < 0) {
			budgetErr = 'Use whole rupee amounts (0 or more).';
			return;
		}
		if (max > 0 && min > max) {
			budgetErr = 'Min must be less than max.';
			return;
		}
		budgetErr = '';
		store.updateSettings({ budgetMin: min, budgetMax: max });
		ui.toast(min || max ? `Budget saved: ${min ? inr(min) : '₹0'} – ${max ? inr(max) : 'any'}.` : 'Budget cleared.', 'ok');
	}
	function clearBudget() {
		minIn = null;
		maxIn = null;
		budgetErr = '';
		store.updateSettings({ budgetMin: 0, budgetMax: 0, hideOutsideBudget: false });
		ui.toast('Budget cleared.', 'info');
	}
	function exportBackup() {
		download(backupFileName(), store.exportJson());
		ui.toast('Backup downloaded.', 'ok');
	}
	async function importBackup(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		if (file.size > 5 * 1024 * 1024) {
			ui.toast('That backup is too large (max 5 MB).', 'err');
			return;
		}
		try {
			// Validate first, so a broken file never gets as far as the confirmation.
			const data = store.parseBackup(await file.text());
			const msg = `It has ${data.wishlist.length} saved, ${data.history.length} scans and ${data.alerts.length} alerts, and replaces what's on this device now.`;
			if (!(await ui.ask({ title: 'Import this backup?', message: msg, confirmLabel: 'Import', danger: false }))) return;
			const n = store.importData(data);
			minIn = store.data.settings.budgetMin || null;
			maxIn = store.data.settings.budgetMax || null;
			ui.toast(`Imported ${n.wishlist} saved, ${n.history} scans, ${n.alerts} alerts.`, 'ok');
		} catch (err) {
			ui.toast((err as Error)?.message ?? "Import failed.", 'err');
		}
	}
	async function startFresh() {
		if (await ui.ask({ title: 'Start fresh?', message: 'This clears your search history, wishlist and price alerts on this device. Budget and store settings stay.', confirmLabel: 'Clear everything' })) {
			store.startFresh();
			ui.toast('All clear - fresh start!', 'ok');
		}
	}
</script>

<div class="page settings">
	<h1 data-testid="page-title">Settings</h1>

	<section class="card stack" aria-labelledby="budget-h" data-testid="budget-settings">
		<h2 id="budget-h"><Icon name="wallet" /> My budget</h2>
		<p class="muted">Results outside your budget are dimmed. Switch on “Hide” to remove them completely.</p>
		<form class="bform" onsubmit={saveBudget}>
			<label class="field"><span>Min price (₹)</span><input class="input mono" type="number" inputmode="numeric" min="0" step="1" placeholder="0" bind:value={minIn} data-testid="budget-min" /></label>
			<label class="field"><span>Max price (₹)</span><input class="input mono" type="number" inputmode="numeric" min="0" step="1" placeholder="No limit" bind:value={maxIn} data-testid="budget-max" /></label>
			<div class="row bbtns">
				<button class="btn green" type="submit" data-testid="budget-save"><Icon name="check" size={18} /> Save budget</button>
				<button class="btn" type="button" onclick={clearBudget}>Clear</button>
			</div>
		</form>
		{#if budgetErr}<p class="err" role="alert">{budgetErr}</p>{/if}
		<label class="switch"><input type="checkbox" checked={s.hideOutsideBudget} onchange={(e) => store.updateSettings({ hideOutsideBudget: e.currentTarget.checked })} data-testid="settings-hide-budget" /> Hide results outside my budget</label>
	</section>

	<section class="card stack" aria-labelledby="stores-h" data-testid="store-settings">
		<h2 id="stores-h"><Icon name="store" /> Stores</h2>
		<p class="muted">Switch off stores you don't want to see in results.</p>
		<ul class="stores">
			{#each STORES as st (st.id)}
				{@const on = !s.hiddenStores.includes(st.id)}
				<li>
					<label class="switch srow">
						<StoreBadge store={st.id} size={36} />
						<span class="sn">{st.name}</span>
						<input type="checkbox" checked={on} onchange={() => store.toggleStore(st.id)} aria-label="Show {st.name}" data-testid="store-toggle-{st.id}" />
					</label>
				</li>
			{/each}
		</ul>
	</section>

	<section class="card stack" aria-labelledby="look-h">
		<h2 id="look-h"><Icon name={ui.theme === 'dark' ? 'moon' : 'sun'} /> Appearance</h2>
		<label class="switch"><input type="checkbox" checked={ui.theme === 'dark'} onchange={() => ui.toggleTheme()} data-testid="settings-dark" /> Dark mode</label>
	</section>

	<section class="card stack" id="data-source" aria-labelledby="src-h">
		<h2 id="src-h"><Icon name="sparkle" /> Data source</h2>
		<p class="row"><ModeBadge /></p>
		{#if ui.mode === 'demo'}
			<p>PriceLens is running in <b>demo mode</b> with built-in sample products, prices and placeholder images - no API keys needed. Photo detection matches your photo's main colours to a sample category; you can always correct it.</p>
		{:else}
			<p>Live mode: prices come from the configured shopping API on the server. Keys never reach your browser.</p>
		{/if}
	</section>

	<section class="card stack" aria-labelledby="bk-h">
		<h2 id="bk-h"><Icon name="download" /> Backup</h2>
		<p class="muted">Everything is stored in this browser (localStorage). Export a JSON backup to move it to another device.</p>
		<div class="row">
			<button type="button" class="btn blue" onclick={exportBackup} data-testid="export-backup"><Icon name="download" size={18} /> Export JSON</button>
			<button type="button" class="btn" onclick={() => fileInput?.click()} data-testid="import-backup"><Icon name="upload" size={18} /> Import JSON</button>
			<input bind:this={fileInput} type="file" accept="application/json,.json" class="sr-only" tabindex="-1" aria-hidden="true" onchange={importBackup} data-testid="import-input" />
		</div>
		<p class="muted fine mono">{store.data.wishlist.length} saved · {store.data.history.length} scans · {store.data.alerts.length} alerts</p>
		{#if !store.storageOk}<p class="err" role="alert">Storage is full or blocked - recent changes may not be saved.</p>{/if}
	</section>

	<section class="card stack danger" aria-labelledby="fresh-h">
		<h2 id="fresh-h"><Icon name="trash" /> Start fresh</h2>
		<p>Clear search history, wishlist and price alerts on this device.</p>
		<button type="button" class="btn pink" onclick={startFresh} data-testid="start-fresh"><Icon name="trash" size={18} /> Start fresh</button>
	</section>

	<section class="card stack privacy" aria-labelledby="priv-h" data-testid="privacy-note">
		<h2 id="priv-h"><Icon name="lock" /> Privacy</h2>
		<p>Your photos are resized and compressed on your device, then <b>processed in memory only</b> to find matching products. <b>Uploaded images are never stored on our server.</b> Your wishlist, history, alerts and settings stay in this browser - there is no account and no database.</p>
	</section>

	<p class="muted fine about">PriceLens · Snap. Compare. Save. · Prices are indicative and may change on the store's site.</p>
</div>

<svelte:head><title>Settings - PriceLens</title></svelte:head>

<style>
	.settings {
		max-width: 760px;
	}
	h2 {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.bform {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		align-items: end;
	}
	.bbtns {
		grid-column: 1 / -1;
	}
	.stores {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 6px;
	}
	.srow {
		width: 100%;
		justify-content: space-between;
		padding: 4px 0;
		border-bottom: 2px dashed var(--line);
	}
	.sn {
		flex: 1;
	}
	.err {
		font-weight: 700;
		color: #111;
		background: var(--red);
		padding: 6px 10px;
		border: 2px solid var(--line);
		border-radius: 10px;
		align-self: flex-start;
	}
	.fine {
		font-size: 0.85rem;
	}
	.danger {
		border-style: dashed;
	}
	.privacy {
		background: var(--surface-2);
	}
	.about {
		text-align: center;
	}
	@media (min-width: 640px) {
		.stores {
			grid-template-columns: 1fr 1fr;
			column-gap: 24px;
		}
		.bform {
			grid-template-columns: 1fr 1fr auto;
		}
		.bbtns {
			grid-column: auto;
		}
	}
</style>
