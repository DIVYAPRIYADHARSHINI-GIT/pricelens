<script lang="ts">
	// Product detail: gallery, price comparison table, SVG price history, size/colour,
	// wishlist + local price alert, share. Demo products load from /api/product/:id;
	// live products come from the browser cache of the last search.
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import type { Product, Suggestion } from '$lib/types.ts';
	import { CATEGORY_LABEL } from '$lib/types.ts';
	import { bestListing, budgetState, LABEL_TEXT, priceLabel, priceStats, sortListings } from '$lib/pricing.ts';
	import { inr, shortDate } from '$lib/format.ts';
	import { store } from '$lib/client/store.svelte.ts';
	import { cachedLive, search } from '$lib/client/search.svelte.ts';
	import { ui } from '$lib/client/ui.svelte.ts';
	import PriceChart from '$lib/components/PriceChart.svelte';
	import Carousel from '$lib/components/Carousel.svelte';
	import ShareBar from '$lib/components/ShareBar.svelte';
	import StoreBadge from '$lib/components/StoreBadge.svelte';
	import Stars from '$lib/components/Stars.svelte';
	import StateCard from '$lib/components/StateCard.svelte';
	import Icon from '$lib/components/Icon.svelte';

	type Loaded = { product: Product; similar: Suggestion[]; cheaper: Suggestion[] };
	let status = $state<'loading' | 'ok' | 'missing' | 'error'>('loading');
	let data = $state<Loaded | null>(null);
	let imgIdx = $state(0);
	let colour = $state('');
	let size = $state('');
	let alertOpen = $state(false);
	let target = $state(0);
	let alertErr = $state('');
	let seq = 0;

	async function load(id: string) {
		const my = ++seq;
		status = 'loading';
		data = null;
		imgIdx = 0;
		colour = '';
		size = '';
		alertOpen = false;
		if (id.startsWith('live-')) {
			const p = cachedLive(id) ?? (search.result?.product?.id === id ? search.result.product : null);
			if (p) {
				data = { product: p, similar: search.result?.product?.id === id ? search.result.similar : [], cheaper: search.result?.product?.id === id ? search.result.cheaper : [] };
				status = 'ok';
			} else status = 'missing';
			return;
		}
		const ctrl = new AbortController();
		const t = setTimeout(() => ctrl.abort(), 10000);
		try {
			const r = await fetch(`/api/product/${encodeURIComponent(id)}`, { signal: ctrl.signal });
			const j = await r.json().catch(() => null);
			if (my !== seq) return;
			if (r.status === 404 || r.status === 400) status = 'missing';
			else if (!r.ok || !j?.ok) status = 'error';
			else {
				data = { product: j.product, similar: j.similar, cheaper: j.cheaper };
				status = 'ok';
			}
		} catch {
			if (my === seq) status = 'error';
		} finally {
			clearTimeout(t);
		}
	}

	// Load whenever the route id changes. Only the id is tracked; load() runs untracked
	// so the state it writes/reads can never re-trigger this effect (no reactive loops).
	$effect(() => {
		const id = page.params.id ?? '';
		untrack(() => void load(id));
	});

	const product = $derived(data?.product ?? null);
	const settings = $derived(store.data.settings);
	const budget = $derived({ min: settings.budgetMin, max: settings.budgetMax, hideOutside: settings.hideOutsideBudget });
	const listings = $derived(product ? sortListings(product.listings.filter((l) => !settings.hiddenStores.includes(l.store)), 'price') : []);
	const best = $derived(bestListing(listings));
	const stats = $derived(priceStats(listings));
	const saved = $derived(product ? store.isSaved(product.id) : false);
	const alert = $derived(product ? store.alertFor(product.id) : undefined);

	function toggleSave() {
		if (!product) return;
		const now = store.toggleWish(product, search.query || product.name);
		ui.toast(now ? `Saved to wishlist at ${inr(bestListing(product.listings)?.price)}.` : 'Removed from wishlist.', now ? 'ok' : 'info');
	}
	function openAlert() {
		alertErr = '';
		target = alert?.target ?? Math.max(1, Math.round(((best?.price ?? stats.min) * 0.9) / 10) * 10);
		alertOpen = !alertOpen;
	}
	function saveAlert(e: SubmitEvent) {
		e.preventDefault();
		if (!product) return;
		const t = Math.round(Number(target));
		if (!Number.isFinite(t) || t < 1) {
			alertErr = 'Enter a target price above ₹0.';
			return;
		}
		if (t > 1_000_000) {
			alertErr = 'That target looks too high.';
			return;
		}
		const a = store.setAlert(product, t, search.query || product.name);
		alertOpen = false;
		ui.toast(a.reached ? `Already at or below ${inr(t)} - alert marked Reached!` : `Alert set: we'll flag it when it drops to ${inr(t)}.`, 'ok');
	}
</script>

<div class="page detail">
	<nav class="crumbs kicker" aria-label="Breadcrumb">
		<a class="back" href="/results" data-testid="back-results"><Icon name="chevronLeft" size={14} /> Back to results</a>
		{#if product}<span aria-hidden="true">/</span><span>{CATEGORY_LABEL[product.category]}</span>{/if}
	</nav>

	{#if status === 'loading'}
		<div class="loadgrid" aria-busy="true" data-testid="detail-loading">
			<h1 class="sr-only" data-testid="page-title">Loading product…</h1>
			<div class="skeleton" style="aspect-ratio:3/4"></div>
			<div class="stack"><div class="skeleton" style="height:80px"></div><div class="skeleton" style="height:200px"></div><div class="skeleton" style="height:120px"></div></div>
		</div>
	{:else if status === 'missing'}
		<h1 class="sr-only" data-testid="page-title">Product not found</h1>
		<StateCard icon="search" tone="pink" title="Product not found" message="This product isn't available any more (live results are only kept for this browser session)." testid="detail-missing">
			<a class="btn primary" href="/"><Icon name="camera" size={16} /> New scan</a>
		</StateCard>
	{:else if status === 'error'}
		<h1 class="sr-only" data-testid="page-title">Couldn't load product</h1>
		<StateCard icon="wifiOff" tone="orange" title="Couldn't load this product" message="Check your internet connection and try again." testid="detail-error">
			<button type="button" class="btn primary" onclick={() => load(page.params.id ?? '')}><Icon name="refresh" size={16} /> Try again</button>
		</StateCard>
	{:else if product}
		<div class="top">
			<!-- Gallery: vertical thumbnail rail + large portrait image (fashion PDP) -->
			<section class="gallery" aria-label="Image gallery" data-testid="gallery">
				{#if product.images.length > 1}
					<div class="thumbs" role="group" aria-label="Choose image">
						{#each product.images as src, i (i)}
							<button type="button" class="tb" aria-pressed={imgIdx === i} aria-label="Show image {i + 1}" onclick={() => (imgIdx = i)} data-testid="gallery-thumb">
								<img {src} alt="" width="60" height="80" />
							</button>
						{/each}
					</div>
				{/if}
				<div class="main-wrap">
					<img class="main-img" src={product.images[imgIdx] ?? product.images[0]} alt="{product.name} - image {imgIdx + 1} of {product.images.length} (placeholder art)" width="480" height="640" data-testid="gallery-main" />
					<span class="counter kicker" aria-hidden="true">{imgIdx + 1} / {product.images.length}</span>
				</div>
			</section>

			<!-- Summary -->
			<section class="summary">
				<span class="kicker brand">{product.brand}</span>
				<h1 data-testid="page-title">{product.name}</h1>
				{#if best}
					<div class="bp">
						<div class="row bpr">
							<span class="price big" data-testid="detail-best">{inr(best.price)}</span>
							{#if best.discountPct > 0}<span class="mrp">{inr(best.mrp)}</span><span class="off">−{best.discountPct}%</span>{/if}
						</div>
						<p class="row muted bpst"><span class="tag lowest">Cheapest ✓</span> on {best.storeName} · {best.deliveryText}</p>
					</div>
				{/if}
				<p class="desc">{product.description}</p>

				{#if product.colours.length}
					<fieldset class="opts">
						<legend>Colour <span class="sel">{colour || 'Select'}</span></legend>
						<div class="row swatches">
							{#each product.colours as c (c.name)}
								<button type="button" class="chip col" aria-pressed={colour === c.name} onclick={() => (colour = colour === c.name ? '' : c.name)} data-testid="colour-option">
									<span class="sw" style="background:{c.hex}" aria-hidden="true"></span>{c.name}
								</button>
							{/each}
						</div>
					</fieldset>
				{/if}
				{#if product.sizes.length}
					<fieldset class="opts">
						<legend>Size <span class="sel">{size || 'Select'}</span></legend>
						<div class="sizes">
							{#each product.sizes as s (s)}
								<button type="button" class="chip" aria-pressed={size === s} onclick={() => (size = size === s ? '' : s)} data-testid="size-option">{s}</button>
							{/each}
						</div>
						<p class="muted fine">Check the size chart on the store's site before buying.</p>
					</fieldset>
				{/if}

				{#if best}
					<a class="btn big primary block" href={best.url} target="_blank" rel="noopener noreferrer" data-testid="detail-buy">Buy on {best.storeName} <Icon name="external" size={16} /><span class="sr-only"> (opens in a new tab)</span></a>
				{/if}
				<div class="acts">
					<button type="button" class="btn" class:on={saved} onclick={toggleSave} aria-pressed={saved} data-testid="detail-save"><Icon name="heart" size={16} /> {saved ? 'In wishlist' : 'Save to wishlist'}</button>
					<button type="button" class="btn" onclick={openAlert} aria-expanded={alertOpen} data-testid="set-alert"><Icon name="bell" size={16} /> {alert ? 'Edit price alert' : 'Set price alert'}</button>
				</div>
				{#if alert && !alertOpen}
					<p class="note" data-testid="alert-status"><Icon name="bell" size={16} />Alert at <b class="mono">{inr(alert.target)}</b>{alert.reached ? ' - Reached!' : ''}. <a href="/alerts">See alerts</a></p>
				{/if}
				{#if alertOpen}
					<form class="alert-form" novalidate onsubmit={saveAlert} data-testid="alert-form">
						<label class="field">
							<span>Tell me when the price drops to (₹)</span>
							<input class="input mono" type="number" inputmode="numeric" min="1" step="1" bind:value={target} aria-invalid={alertErr ? 'true' : undefined} data-testid="alert-target" />
						</label>
						{#if alertErr}<p class="err" role="alert">{alertErr}</p>{/if}
						<p class="muted fine">Saved on this device. Prices refresh when you open Alerts. Email or push alerts need a backend (not included in this demo).</p>
						<div class="row">
							<button class="btn primary" type="submit" data-testid="alert-save"><Icon name="check" size={16} /> Save alert</button>
							<button class="btn quiet" type="button" onclick={() => (alertOpen = false)}>Cancel</button>
						</div>
					</form>
				{/if}
				<dl class="meta">
					<div><dt>Category</dt><dd>{CATEGORY_LABEL[product.category]}</dd></div>
					<div><dt>Stores</dt><dd>{listings.length}</dd></div>
					<div><dt>Product ID</dt><dd class="mono">{product.id.slice(0, 22)}</dd></div>
				</dl>
			</section>
		</div>

		<!-- Comparison table -->
		<section class="pane" aria-labelledby="cmp-h">
			<div class="sec-head"><div><span class="kicker">Every store, cheapest first</span><h2 id="cmp-h">Price comparison</h2></div></div>
			<div class="tbl-wrap">
				<table class="cmp" data-testid="compare-table">
					<caption class="sr-only">Prices for {product.name} across stores, cheapest first</caption>
					<thead>
						<tr><th scope="col">Store</th><th scope="col">Price</th><th scope="col">Discount</th><th scope="col">Rating</th><th scope="col">Delivery</th><th scope="col"><span class="sr-only">Buy</span></th></tr>
					</thead>
					<tbody>
						{#each listings as l (l.id)}
							{@const lab = priceLabel(l.price, listings)}
							<tr class:dim={budgetState(l.price, budget) !== 'ok'} data-testid="compare-row">
								<th scope="row"><span class="row st"><StoreBadge store={l.store} name={l.storeName} size={34} />{l.storeName}</span></th>
								<td><span class="price">{inr(l.price)}</span><br /><span class="tag {lab} tiny">{LABEL_TEXT[lab]}</span></td>
								<td class="off">{l.discountPct ? `−${l.discountPct}%` : '—'}</td>
								<td><Stars rating={l.rating} /></td>
								<td>{l.deliveryText}</td>
								<td><a class="btn sm" href={l.url} target="_blank" rel="noopener noreferrer">Buy<span class="sr-only"> on {l.storeName} (opens in a new tab)</span></a></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<p class="muted fine">Prices are indicative and may change on the store's site.</p>
		</section>

		<div class="two">
			<!-- Price history -->
			<section class="pane" aria-labelledby="hist-h">
				<div class="sec-head">
					<div><span class="kicker">{product.priceHistory.length > 1 ? `Lowest price per week · since ${shortDate(product.priceHistory[0].date)}` : 'Over time'}</span><h2 id="hist-h">Price history</h2></div>
				</div>
				<PriceChart points={product.priceHistory} target={alert?.target ?? 0} />
			</section>

			<section class="pane" aria-labelledby="share-h">
				<div class="sec-head"><div><span class="kicker">Send it to a friend</span><h2 id="share-h">Share</h2></div></div>
				<ShareBar {product} {listings} />
			</section>
		</div>

		{#if data}
			<Carousel title="Similar styles" items={data.similar} testid="similar" />
			<Carousel title="Cheaper alternatives" items={data.cheaper} reference={stats.min} showSavings testid="cheaper" />
		{/if}
	{/if}
</div>

<svelte:head><title>{product ? `${product.name} - PriceLens` : 'Product - PriceLens'}</title></svelte:head>

<style>
	.detail {
		gap: 40px;
	}
	.crumbs {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 44px;
		color: var(--ink);
		text-decoration: none;
	}
	.back:hover {
		text-decoration: underline;
	}
	.loadgrid,
	.top {
		display: grid;
		gap: 28px;
		margin-top: -16px;
	}
	.gallery {
		display: flex;
		flex-direction: column-reverse;
		gap: 10px;
		min-width: 0;
	}
	.main-wrap {
		position: relative;
		background: var(--surface-2);
	}
	.main-img {
		width: 100%;
		height: auto;
		aspect-ratio: 3 / 4;
		object-fit: cover;
	}
	.counter {
		position: absolute;
		right: 12px;
		bottom: 12px;
		color: var(--ink-2);
	}
	.thumbs {
		display: flex;
		gap: 8px;
	}
	.tb {
		flex: none;
		padding: 0;
		width: 60px;
		height: 80px;
		border: 1px solid transparent;
		cursor: pointer;
		background: var(--surface-2);
		opacity: 0.6;
		transition: opacity 0.2s var(--ease), border-color 0.2s var(--ease);
	}
	.tb:hover {
		opacity: 1;
	}
	.tb[aria-pressed='true'] {
		opacity: 1;
		border-color: var(--ink);
	}
	.tb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.summary {
		display: flex;
		flex-direction: column;
		gap: 18px;
		min-width: 0;
	}
	.brand {
		color: var(--ink);
	}
	.summary h1 {
		margin-top: -8px;
		font-size: clamp(2rem, 6vw, 3rem);
	}
	.bp {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.bpr {
		gap: 12px;
		align-items: baseline;
	}
	.price.big {
		font-family: var(--serif);
		font-weight: 400;
		font-size: 2.2rem;
		line-height: 1;
	}
	.bpst {
		gap: 8px;
		font-size: 0.88rem;
	}
	.desc {
		color: var(--ink-2);
		max-width: 52ch;
		padding-bottom: 18px;
		border-bottom: 1px solid var(--hair);
	}
	.opts {
		border: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-width: 0;
	}
	legend {
		margin-bottom: 10px;
		font: 500 0.72rem/1.2 var(--sans);
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}
	.sel {
		margin-left: 8px;
		color: var(--muted);
		letter-spacing: 0.08em;
		text-transform: none;
		font-family: var(--serif);
		font-style: italic;
		font-size: 0.95rem;
	}
	.swatches {
		gap: 8px;
	}
	.col {
		text-transform: none;
		letter-spacing: 0.04em;
		font-size: 0.82rem;
	}
	.col .sw {
		width: 14px;
		height: 14px;
		border: 1px solid var(--hair);
		border-radius: 50%;
	}
	.sizes {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
		gap: 6px;
	}
	.sizes .chip {
		padding: 0 6px;
	}
	.acts {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		margin-top: -8px;
	}
	.acts .btn {
		padding: 0 10px;
	}
	.alert-form {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 20px;
		background: var(--surface-2);
	}
	.fine {
		font-size: 0.82rem;
	}
	.meta {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		margin: 4px 0 0;
		border-top: 1px solid var(--hair);
	}
	.meta div {
		padding: 12px 0 0;
		min-width: 0;
	}
	.meta dt {
		font: 500 0.64rem/1.2 var(--sans);
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.meta dd {
		margin: 4px 0 0;
		font-size: 0.9rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.pane {
		display: flex;
		flex-direction: column;
		gap: 16px;
		min-width: 0;
	}
	.two {
		display: grid;
		gap: 40px;
	}
	.tbl-wrap {
		overflow-x: auto;
	}
	.cmp {
		width: 100%;
		border-collapse: collapse;
		min-width: 640px;
	}
	.cmp th,
	.cmp td {
		padding: 14px 10px 14px 0;
		text-align: left;
		border-bottom: 1px solid var(--hair);
		vertical-align: middle;
		font-size: 0.92rem;
	}
	.cmp thead th {
		padding-top: 0;
		font: 500 0.66rem/1.2 var(--sans);
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--muted);
		border-bottom-color: var(--ink);
	}
	.cmp tbody th {
		font-weight: 500;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		font-size: 0.76rem;
	}
	.cmp td:last-child {
		text-align: right;
		padding-right: 0;
	}
	.cmp .price {
		font-size: 1.02rem;
	}
	.cmp tr.dim {
		opacity: 0.45;
	}
	.st {
		gap: 12px;
		flex-wrap: nowrap;
	}
	.tiny {
		font-size: 0.6rem;
		padding: 2px 6px;
		margin-top: 6px;
	}
	@media (min-width: 640px) {
		.gallery {
			flex-direction: row;
			align-items: flex-start;
		}
		.thumbs {
			flex-direction: column;
		}
		.main-wrap {
			flex: 1;
		}
	}
	@media (min-width: 900px) {
		.top,
		.loadgrid {
			grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
			align-items: start;
			gap: 56px;
		}
		.summary {
			position: sticky;
			top: 112px;
		}
		.two {
			grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
			gap: 56px;
		}
	}
</style>
