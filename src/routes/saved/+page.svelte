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
	<header class="ph-head">
		<span class="kicker">Your edit</span>
		<h1 data-testid="page-title">Saved</h1>
		<nav class="row jump" aria-label="Jump to section">
			<a class="textlink" href="#wishlist">Wishlist ({wish.length})</a>
			<a class="textlink" href="#history">History ({history.length})</a>
		</nav>
	</header>

	<section class="stack" id="wishlist" aria-labelledby="wl-h">
		<div class="sec-head"><div><span class="kicker">{wish.length} piece{wish.length === 1 ? '' : 's'}</span><h2 id="wl-h">Wishlist</h2></div></div>
		{#if wish.length === 0}
			<StateCard icon="heart" tone="pink" title="Your wishlist is empty" message="Tap Save on any result to keep it here with the best price at the time you saved it." testid="wishlist-empty">
				<a class="btn primary" href="/"><Icon name="camera" size={16} /> Scan something</a>
			</StateCard>
		{:else}
			<ul class="wgrid" data-testid="wishlist">
				{#each wish as w (w.id)}
					<li class="wc" data-testid="wish-card">
						<div class="wimg zoom">
							<a href={openWish(w)} tabindex="-1" aria-hidden="true"><img src={w.image || categoryArt(w.category)} alt="{w.name} - placeholder image" width="240" height="320" /></a>
							<button type="button" class="rm" onclick={() => remove(w.id, w.name)} aria-label="Remove {w.name} from wishlist" data-testid="wish-remove"><Icon name="close" size={16} /></button>
						</div>
						<span class="kicker">{CATEGORY_LABEL[w.category]}</span>
						<a href={openWish(w)} class="wn">{w.name}</a>
						<p class="wp"><span class="price">{inr(w.price)}</span> <span class="muted">at {w.storeName}</span></p>
						<p class="muted fine">Best price when saved · {shortDate(w.savedAt)}</p>
						{#if w.url}<a class="btn sm block" href={w.url} target="_blank" rel="noopener noreferrer">Buy<span class="sr-only"> {w.name} on {w.storeName} (opens in a new tab)</span></a>{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="stack" id="history" aria-labelledby="hi-h">
		<div class="sec-head">
			<div><span class="kicker">Recent scans & searches</span><h2 id="hi-h">Search history</h2></div>
			{#if history.length}<button type="button" class="textlink" onclick={clearHistory} data-testid="clear-history">Clear all</button>{/if}
		</div>
		{#if history.length === 0}
			<StateCard icon="history" tone="blue" title="No recent scans" message="Your scans and searches show up here so you can re-run them later." testid="history-empty" />
		{:else}
			<ul class="hlist" data-testid="history">
				{#each history as h (h.id)}
					<li class="hi" data-testid="history-item">
						{#if h.thumb}
							<img class="hthumb" src={h.thumb} alt="Your scan: {h.label}" width="48" height="64" />
						{:else}
							<span class="hthumb ph" aria-hidden="true"><Icon name={h.kind === 'text' ? 'search' : 'tag'} size={18} /></span>
						{/if}
						<div class="ht">
							<span class="hl">{h.label}</span>
							<small class="muted">
								{h.kind === 'photo' ? 'Photo scan' : h.kind === 'category' ? 'Category' : `"${h.query}"`} · {timeAgo(h.at)}{h.bestPrice ? ` · from ${inr(h.bestPrice)}` : ''}
							</small>
						</div>
						<div class="row hb">
							<button type="button" class="btn sm" onclick={() => search.rerun(h)} data-testid="history-rerun"><Icon name="refresh" size={14} /> Re-run</button>
							<button type="button" class="btn sm icon-only quiet" onclick={() => store.removeHistory(h.id)} aria-label="Delete {h.label} from history" data-testid="history-delete"><Icon name="trash" size={16} /></button>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

<svelte:head><title>Saved - PriceLens</title></svelte:head>

<style>
	.ph-head {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.jump {
		gap: 22px;
	}
	.wgrid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(46%, 200px), 1fr));
		gap: 28px 16px;
	}
	.wc {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.wimg {
		position: relative;
		aspect-ratio: 3 / 4;
		margin-bottom: 6px;
		background: var(--surface-2);
	}
	.wimg a,
	.wimg img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.rm {
		position: absolute;
		top: 6px;
		right: 6px;
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		color: var(--ink);
		background: color-mix(in srgb, var(--bg) 85%, transparent);
		border: 0;
		border-radius: 50%;
		cursor: pointer;
	}
	.rm:hover {
		color: var(--on-ink);
		background: var(--ink);
	}
	.wn {
		font-family: var(--serif);
		font-size: 1.12rem;
		line-height: 1.2;
		text-decoration: none;
	}
	.wn:hover {
		text-decoration: underline;
	}
	.wp .price {
		font-size: 1.05rem;
	}
	.fine {
		font-size: 0.78rem;
		margin-bottom: 6px;
	}
	.hlist {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}
	.hi {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 10px 16px;
		align-items: center;
		padding: 14px 0;
		border-bottom: 1px solid var(--hair);
	}
	.hthumb {
		width: 48px;
		height: 64px;
		object-fit: cover;
		background: var(--surface-2);
	}
	.ph {
		display: grid;
		place-items: center;
	}
	.ht {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.hl {
		font-family: var(--serif);
		font-size: 1.1rem;
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
	@media (min-width: 900px) {
		.wgrid {
			grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		}
	}
</style>
