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
	<header class="sec-head top">
		<div>
			<span class="kicker">{alerts.length} alert{alerts.length === 1 ? '' : 's'}{reached ? ` · ${reached} reached` : ''}</span>
			<h1 data-testid="page-title">Price alerts</h1>
		</div>
		{#if alerts.length}
			<button type="button" class="btn primary" onclick={refresh} disabled={refreshing} aria-busy={refreshing} data-testid="refresh-alerts">
				<Icon name="refresh" size={16} class={refreshing ? 'spin' : ''} />
				{refreshing ? 'Checking…' : 'Refresh prices'}
			</button>
		{/if}
	</header>

	<p class="note"><Icon name="bell" size={16} /> Alerts are saved on this device and checked when you tap Refresh. Email or push alerts need a backend (not included).</p>

	{#if alerts.length === 0}
		<StateCard icon="bell" tone="yellow" title="No price alerts yet" message="Open a product and tap “Set price alert” to pick a target price." testid="alerts-empty">
			<a class="btn primary" href="/"><Icon name="camera" size={16} /> Find a product</a>
		</StateCard>
	{:else}
		<ul class="alist" data-testid="alerts">
			{#each alerts as a (a.id)}
				{@const diff = a.currentPrice - a.target}
				<li class="al" class:reached={a.reached} data-testid="alert-item">
					<img class="athumb" src={a.image || categoryArt('other')} alt="{a.name} - placeholder image" width="72" height="96" />
					<div class="ai">
						{#if a.reached}<span class="stamp" data-testid="reached-badge">Reached!</span>{/if}
						<a class="an" href={a.id.startsWith('live-') ? `/results?q=${encodeURIComponent(a.query)}` : `/product/${a.id}`}>{a.name}</a>
						<dl class="nums">
							<div><dt>Target</dt><dd class="mono" data-testid="alert-target-val">{inr(a.target)}</dd></div>
							<div><dt>Now{a.storeName ? ` · ${a.storeName}` : ''}</dt><dd class="mono" data-testid="alert-current">{inr(a.currentPrice)}</dd></div>
						</dl>
						<p class="muted fine">
							{#if a.reached}
								Price hit your target{a.reachedAt ? ` ${timeAgo(a.reachedAt)}` : ''} - go grab it.
							{:else if diff > 0}
								{inr(diff)} to go · started at {inr(a.startPrice)}
							{/if}
							· {a.checkedAt ? `checked ${timeAgo(a.checkedAt)}` : 'not checked yet'}
						</p>
					</div>
					<button type="button" class="btn sm icon-only quiet del" onclick={() => remove(a.id, a.name)} aria-label="Delete alert for {a.name}" data-testid="alert-delete"><Icon name="trash" size={16} /></button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<svelte:head><title>Alerts - PriceLens</title></svelte:head>

<style>
	.top {
		border-bottom: 0;
		padding-bottom: 0;
	}
	.alist {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		border-top: 1px solid var(--hair);
	}
	.al {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 16px;
		align-items: center;
		padding: 18px 0;
		border-bottom: 1px solid var(--hair);
	}
	.athumb {
		width: 72px;
		height: 96px;
		object-fit: cover;
		background: var(--surface-2);
	}
	.ai {
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
	}
	.an {
		font-family: var(--serif);
		font-size: 1.25rem;
		line-height: 1.15;
		color: inherit;
		text-decoration: none;
		overflow-wrap: anywhere;
	}
	.an:hover {
		text-decoration: underline;
	}
	.nums {
		display: flex;
		gap: 28px;
		margin: 0;
	}
	.nums dt {
		font: 500 0.64rem/1.2 var(--sans);
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.nums dd {
		margin: 2px 0 0;
		font-size: 1.05rem;
		font-weight: 500;
	}
	.al.reached .nums div:last-child dd {
		color: var(--sage-fg);
	}
	.fine {
		font-size: 0.8rem;
	}
	.stamp {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		font: 500 0.66rem/1.2 var(--sans);
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--sage-fg);
		background: var(--sage-bg);
	}
	.stamp::before {
		content: '';
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: currentColor;
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
