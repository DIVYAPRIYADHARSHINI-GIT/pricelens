<script lang="ts">
	// Saved: wishlist cards (best price at the time of saving) + search history (re-run / delete).
	import { store } from '$lib/client/store.svelte.ts';
	import { search } from '$lib/client/search.svelte.ts';
	import { ui } from '$lib/client/ui.svelte.ts';
	import { inr, shortDate, timeAgo } from '$lib/format.ts';
	import { CATEGORY_LABEL } from '$lib/types.ts';
	import { categoryArt } from '$lib/art.ts';
	import StateCard from '$lib/components/StateCard.svelte';
	import Icon from '$lib/components/Icon.svelte';

	const wish = $derived(store.data.wishlist);
	const history = $derived(store.data.history);

	function remove(id: string, name: string) {
		store.removeWish(id);
		ui.toast(`Removed "${name}" from wishlist.`, 'info');
	}
	async function clearHistory() {
		if (await ui.ask({ title: 'Clear search history?', message: `This deletes all ${history.length} recent scans on this device.`, confirmLabel: 'Clear history' })) {
			store.clearHistory();
			ui.toast('Search history cleared.', 'info');
		}
	}
	function openWish(w: (typeof wish)[number]) {
		if (w.source === 'demo') return `/product/${w.id}`;
		return `/results?q=${encodeURIComponent(w.query || w.name)}`;
	}
</script>

<div class="page">
	<header class="stack">
		<h1 data-testid="page-title">Saved</h1>
		<nav class="row jump" aria-label="Jump to section">
			<a class="chip" href="#wishlist">Wishlist <b class="mono">{wish.length}</b></a>
			<a class="chip" href="#history">History <b class="mono">{history.length}</b></a>
		</nav>
	</header>

	<section class="stack" id="wishlist" aria-labelledby="wl-h">
		<h2 id="wl-h"><Icon name="heart" /> Wishlist</h2>
		{#if wish.length === 0}
			<StateCard icon="heart" tone="pink" title="Your wishlist is empty" message="Tap Save on any result to keep it here with the best price at the time you saved it." testid="wishlist-empty">
				<a class="btn yellow" href="/"><Icon name="camera" size={18} /> Scan something</a>
			</StateCard>
		{:else}
			<ul class="wgrid" data-testid="wishlist">
				{#each wish as w (w.id)}
					<li class="wc card wobble" data-testid="wish-card">
						<a href={openWish(w)} class="wlink">
							<img class="thumb" src={w.image || categoryArt(w.category)} alt="{w.name} - placeholder image" width="160" height="160" loading="lazy" />
							<b class="wn">{w.name}</b>
						</a>
						<p class="row"><span class="tag">{CATEGORY_LABEL[w.category]}</span></p>
						<p class="wp"><span class="price">{inr(w.price)}</span> <span class="muted">at {w.storeName}</span></p>
						<p class="muted fine">Best price when saved · {shortDate(w.savedAt)}</p>
						<div class="row">
							{#if w.url}<a class="btn sm yellow" href={w.url} target="_blank" rel="noopener noreferrer">Buy<span class="sr-only"> {w.name} on {w.storeName} (opens in a new tab)</span></a>{/if}
							<button type="button" class="btn sm icon-only" onclick={() => remove(w.id, w.name)} aria-label="Remove {w.name} from wishlist" data-testid="wish-remove"><Icon name="trash" size={18} /></button>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="stack" id="history" aria-labelledby="hi-h">
		<div class="spread">
			<h2 id="hi-h"><Icon name="history" /> Search history</h2>
			{#if history.length}<button type="button" class="btn sm" onclick={clearHistory} data-testid="clear-history"><Icon name="trash" size={16} /> Clear all</button>{/if}
		</div>
		{#if history.length === 0}
			<StateCard icon="history" tone="blue" title="No recent scans" message="Your scans and searches show up here so you can re-run them later." testid="history-empty" />
		{:else}
			<ul class="hlist" data-testid="history">
				{#each history as h (h.id)}
					<li class="hi card flat" data-testid="history-item">
						{#if h.thumb}
							<img class="thumb" src={h.thumb} alt="Your scan: {h.label}" width="56" height="56" />
						{:else}
							<span class="thumb ph" aria-hidden="true"><Icon name={h.kind === 'text' ? 'search' : 'tag'} size={22} /></span>
						{/if}
						<div class="ht">
							<b>{h.label}</b>
							<small class="muted">
								{h.kind === 'photo' ? 'Photo scan' : h.kind === 'category' ? 'Category' : `"${h.query}"`} · {timeAgo(h.at)}{h.bestPrice ? ` · from ${inr(h.bestPrice)}` : ''}
							</small>
						</div>
						<div class="row hb">
							<button type="button" class="btn sm" onclick={() => search.rerun(h)} data-testid="history-rerun"><Icon name="refresh" size={16} /> Re-run</button>
							<button type="button" class="btn sm icon-only" onclick={() => store.removeHistory(h.id)} aria-label="Delete {h.label} from history" data-testid="history-delete"><Icon name="trash" size={18} /></button>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

<svelte:head><title>Saved - PriceLens</title></svelte:head>

<style>
	h2 {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.jump {
		gap: 8px;
	}
	.jump .chip {
		text-decoration: none;
	}
	.wgrid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 160px), 1fr));
		gap: 14px;
	}
	.wc {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 10px;
	}
	.wlink {
		display: flex;
		flex-direction: column;
		gap: 8px;
		text-decoration: none;
		color: var(--ink);
	}
	.wlink img {
		width: 100%;
		height: auto;
	}
	.wn {
		line-height: 1.2;
	}
	.wp .price {
		font-size: 1.25rem;
	}
	.fine {
		font-size: 0.8rem;
	}
	.hlist {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.hi {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 10px 12px;
		align-items: center;
		padding: 10px 12px;
	}
	.hi .thumb {
		width: 56px;
		height: 56px;
	}
	.ph {
		display: grid;
		place-items: center;
	}
	.ht {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.ht b {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.hb {
		grid-column: 1 / -1;
		justify-content: flex-end;
		gap: 8px;
	}
	@media (min-width: 640px) {
		.hi {
			grid-template-columns: auto 1fr auto;
		}
		.hb {
			grid-column: auto;
		}
	}
</style>
