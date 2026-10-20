<script lang="ts">
	// Price alerts saved locally. "Refresh prices" asks /api/prices for current best prices;
	// an alert shows "Reached!" once a refreshed price is at or below its target.
	import { store } from '$lib/client/store.svelte.ts';
	import { ui } from '$lib/client/ui.svelte.ts';
	import { inr, timeAgo } from '$lib/format.ts';
	import { categoryArt } from '$lib/art.ts';
	import StateCard from '$lib/components/StateCard.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let refreshing = $state(false);
	const alerts = $derived(store.data.alerts);
	const reached = $derived(alerts.filter((a) => a.reached).length);

	async function refresh() {
		if (refreshing) return;
		if (!ui.online) {
			ui.toast("You're offline - can't refresh prices right now.", 'err');
			return;
		}
		refreshing = true;
		try {
			const n = await store.refreshAlerts();
			ui.toast(n > 0 ? `${n} alert${n === 1 ? '' : 's'} reached your target price!` : 'Prices refreshed - no new drops yet.', n > 0 ? 'ok' : 'info');
		} catch (e) {
			ui.toast((e as Error)?.name === 'AbortError' ? 'Refresh took too long. Try again.' : ((e as Error)?.message ?? 'Could not refresh prices.'), 'err');
		} finally {
			refreshing = false;
		}
	}
	async function remove(id: string, name: string) {
		if (await ui.ask({ title: 'Delete this alert?', message: `Stop watching the price of "${name}"?`, confirmLabel: 'Delete alert' })) {
			store.removeAlert(id);
			ui.toast('Alert deleted.', 'info');
		}
	}
</script>

<div class="page">
	<header class="spread">
		<div class="stack hd">
			<h1 data-testid="page-title">Price alerts</h1>
			<p class="muted">{alerts.length} alert{alerts.length === 1 ? '' : 's'}{reached ? ` · ${reached} reached` : ''}</p>
		</div>
		{#if alerts.length}
			<button type="button" class="btn yellow" onclick={refresh} disabled={refreshing} aria-busy={refreshing} data-testid="refresh-alerts">
				<Icon name="refresh" size={18} class={refreshing ? 'spin' : ''} />
				{refreshing ? 'Checking…' : 'Refresh prices'}
			</button>
		{/if}
	</header>

	<p class="note"><Icon name="bell" size={18} /> Alerts are saved on this device and checked when you tap Refresh. Email or push alerts need a backend (not included).</p>

	{#if alerts.length === 0}
		<StateCard icon="bell" tone="yellow" title="No price alerts yet" message="Open a product and tap “Set price alert” to pick a target price." testid="alerts-empty">
			<a class="btn yellow" href="/"><Icon name="camera" size={18} /> Find a product</a>
		</StateCard>
	{:else}
		<ul class="alist" data-testid="alerts">
			{#each alerts as a (a.id)}
				{@const diff = a.currentPrice - a.target}
				<li class="al card" class:reached={a.reached} data-testid="alert-item">
					{#if a.reached}<span class="stamp" data-testid="reached-badge">Reached!</span>{/if}
					<img class="thumb" src={a.image || categoryArt('other')} alt="{a.name} - placeholder image" width="72" height="72" />
					<div class="ai">
						<a class="an" href={a.id.startsWith('live-') ? `/results?q=${encodeURIComponent(a.query)}` : `/product/${a.id}`}>{a.name}</a>
						<div class="row nums">
							<span>Target <b class="mono" data-testid="alert-target-val">{inr(a.target)}</b></span>
							<span>Now <b class="mono" data-testid="alert-current">{inr(a.currentPrice)}</b>{a.storeName ? ` on ${a.storeName}` : ''}</span>
						</div>
						<p class="muted fine">
							{#if a.reached}
								Price hit your target{a.reachedAt ? ` ${timeAgo(a.reachedAt)}` : ''} - go grab it!
							{:else if diff > 0}
								{inr(diff)} to go · started at {inr(a.startPrice)}
							{/if}
							· {a.checkedAt ? `checked ${timeAgo(a.checkedAt)}` : 'not checked yet'}
						</p>
					</div>
					<button type="button" class="btn sm icon-only del" onclick={() => remove(a.id, a.name)} aria-label="Delete alert for {a.name}" data-testid="alert-delete"><Icon name="trash" size={18} /></button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<svelte:head><title>Alerts - PriceLens</title></svelte:head>

<style>
	.hd {
		gap: 4px;
	}
	.alist {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.al {
		position: relative;
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 12px;
		align-items: center;
		padding: 12px;
	}
	.al.reached {
		background: var(--green);
		color: #111;
	}
	:global(html[data-theme='dark']) .al.reached {
		background: #0f2a18;
		color: var(--ink);
		border-color: var(--green);
	}
	.al .thumb {
		width: 64px;
		height: 64px;
	}
	.ai {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.an {
		font-weight: 700;
		color: inherit;
		overflow-wrap: anywhere;
	}
	.nums {
		gap: 4px 14px;
		font-size: 0.92rem;
	}
	.fine {
		font-size: 0.82rem;
	}
	.al.reached .muted {
		color: inherit;
		opacity: 0.85;
	}
	.stamp {
		position: absolute;
		top: -12px;
		right: 56px;
		padding: 3px 10px;
		font: 700 0.85rem var(--mono);
		color: #111;
		background: var(--yellow);
		border: var(--bw) solid #111;
		border-radius: 8px;
		box-shadow: 2px 2px 0 #111;
		rotate: 5deg;
	}
	:global(.spin) {
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to {
			rotate: 360deg;
		}
	}
</style>
