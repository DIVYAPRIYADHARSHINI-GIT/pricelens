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
	<a class="btn sm back" href="/results" data-testid="back-results"><Icon name="chevronLeft" size={18} /> Back to results</a>

	{#if status === 'loading'}
		<div class="loadgrid" aria-busy="true" data-testid="detail-loading">
			<h1 class="sr-only" data-testid="page-title">Loading product…</h1>
			<div class="skeleton" style="aspect-ratio:1"></div>
			<div class="stack"><div class="skeleton" style="height:60px"></div><div class="skeleton" style="height:180px"></div><div class="skeleton" style="height:120px"></div></div>
		</div>
	{:else if status === 'missing'}
		<h1 class="sr-only" data-testid="page-title">Product not found</h1>
		<StateCard icon="search" tone="pink" title="Product not found" message="This product isn't available any more (live results are only kept for this browser session)." testid="detail-missing">
			<a class="btn yellow" href="/"><Icon name="camera" size={18} /> New scan</a>
		</StateCard>
	{:else if status === 'error'}
		<h1 class="sr-only" data-testid="page-title">Couldn't load product</h1>
		<StateCard icon="wifiOff" tone="orange" title="Couldn't load this product" message="Check your internet connection and try again." testid="detail-error">
			<button type="button" class="btn yellow" onclick={() => load(page.params.id ?? '')}><Icon name="refresh" size={18} /> Try again</button>
		</StateCard>
	{:else if product}
		<div class="top">
			<!-- Gallery -->
			<section class="gallery" aria-label="Image gallery" data-testid="gallery">
				<img class="main-img thumb" src={product.images[imgIdx] ?? product.images[0]} alt="{product.name} - image {imgIdx + 1} of {product.images.length} (placeholder art)" width="480" height="480" data-testid="gallery-main" />
				{#if product.images.length > 1}
					<div class="thumbs" role="group" aria-label="Choose image">
						{#each product.images as src, i (i)}
							<button type="button" class="tb" aria-pressed={imgIdx === i} aria-label="Show image {i + 1}" onclick={() => (imgIdx = i)} data-testid="gallery-thumb">
								<img {src} alt="" width="64" height="64" />
							</button>
						{/each}
					</div>
				{/if}
			</section>

			<!-- Summary -->
			<section class="summary stack">
				<p class="row"><span class="tag">{CATEGORY_LABEL[product.category]}</span><span class="tag mono" title="Product ID">ID {product.id.slice(0, 22)}</span></p>
				<h1 data-testid="page-title">{product.name}</h1>
				<p class="muted">by <b>{product.brand}</b> · {product.description}</p>
				{#if best}
					<div class="bp card flat">
						<span class="tag lowest">Cheapest ✓</span>
						<div class="row bpr">
							<StoreBadge store={best.store} name={best.storeName} size={40} />
							<span class="price big" data-testid="detail-best">{inr(best.price)}</span>
							<span class="muted">on {best.storeName}</span>
						</div>
						<a class="btn green block" href={best.url} target="_blank" rel="noopener noreferrer" data-testid="detail-buy">Buy on {best.storeName} <Icon name="external" size={18} /><span class="sr-only"> (opens in a new tab)</span></a>
					</div>
				{/if}

				{#if product.colours.length}
					<fieldset class="opts">
						<legend>Colour {colour ? `· ${colour}` : ''}</legend>
						<div class="row">
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
						<legend>Size {size ? `· ${size}` : ''}</legend>
						<div class="row">
							{#each product.sizes as s (s)}
								<button type="button" class="chip" aria-pressed={size === s} onclick={() => (size = size === s ? '' : s)} data-testid="size-option">{s}</button>
							{/each}
						</div>
						<p class="muted fine">Check the size chart on the store's site before buying.</p>
					</fieldset>
				{/if}

				<div class="row acts">
					<button type="button" class="btn {saved ? 'pink' : ''}" onclick={toggleSave} aria-pressed={saved} data-testid="detail-save"><Icon name="heart" size={18} /> {saved ? 'In wishlist' : 'Save to wishlist'}</button>
					<button type="button" class="btn yellow" onclick={openAlert} aria-expanded={alertOpen} data-testid="set-alert"><Icon name="bell" size={18} /> {alert ? 'Edit price alert' : 'Set price alert'}</button>
				</div>
				{#if alert && !alertOpen}
					<p class="note" data-testid="alert-status"><Icon name="bell" size={18} />Alert at <b class="mono">{inr(alert.target)}</b>{alert.reached ? ' - Reached!' : ''}. <a href="/alerts">See alerts</a></p>
				{/if}
				{#if alertOpen}
					<form class="card flat alert-form" novalidate onsubmit={saveAlert} data-testid="alert-form">
						<label class="field">
							<span>Tell me when the price drops to (₹)</span>
							<input class="input mono" type="number" inputmode="numeric" min="1" step="1" bind:value={target} aria-invalid={alertErr ? 'true' : undefined} data-testid="alert-target" />
						</label>
						{#if alertErr}<p class="err" role="alert">{alertErr}</p>{/if}
						<p class="muted fine">Saved on this device. Prices refresh when you open Alerts. Email or push alerts need a backend (not included in this demo).</p>
						<div class="row">
							<button class="btn green" type="submit" data-testid="alert-save"><Icon name="check" size={18} /> Save alert</button>
							<button class="btn" type="button" onclick={() => (alertOpen = false)}>Cancel</button>
						</div>
					</form>
				{/if}
			</section>
		</div>

		<!-- Comparison table -->
		<section class="card" aria-labelledby="cmp-h">
			<h2 id="cmp-h">Price comparison</h2>
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
								<th scope="row"><span class="row st"><StoreBadge store={l.store} name={l.storeName} size={32} />{l.storeName}</span></th>
								<td><span class="price">{inr(l.price)}</span><br /><span class="tag {lab} tiny">{LABEL_TEXT[lab]}</span></td>
								<td class="mono">{l.discountPct ? `${l.discountPct}%` : '—'}</td>
								<td><Stars rating={l.rating} /></td>
								<td>{l.deliveryText}</td>
								<td><a class="btn sm yellow" href={l.url} target="_blank" rel="noopener noreferrer">Buy<span class="sr-only"> on {l.storeName} (opens in a new tab)</span></a></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<p class="muted fine">Prices are indicative and may change on the store's site.</p>
		</section>

		<!-- Price history -->
		<section class="card stack" aria-labelledby="hist-h">
			<div class="spread">
				<h2 id="hist-h">Price history</h2>
				{#if product.priceHistory.length > 1}<span class="muted fine">Lowest price per week · since {shortDate(product.priceHistory[0].date)}</span>{/if}
			</div>
			<PriceChart points={product.priceHistory} target={alert?.target ?? 0} />
		</section>

		<section class="card stack">
			<h2>Share</h2>
			<ShareBar {product} {listings} />
		</section>

		{#if data}
			<Carousel title="Similar styles" items={data.similar} testid="similar" />
			<Carousel title="Cheaper alternatives" items={data.cheaper} reference={stats.min} showSavings testid="cheaper" />
		{/if}
	{/if}
</div>

<svelte:head><title>{product ? `${product.name} - PriceLens` : 'Product - PriceLens'}</title></svelte:head>

<style>
	.back {
		align-self: flex-start;
	}
	.loadgrid,
	.top {
		display: grid;
		gap: 20px;
	}
	.gallery {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.main-img {
		width: 100%;
		height: auto;
		max-width: 480px;
		border-radius: 20px;
		box-shadow: var(--shadow);
	}
	.thumbs {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}
	.tb {
		padding: 0;
		width: 64px;
		height: 64px;
		border: var(--bw) solid var(--line);
		border-radius: 12px;
		overflow: hidden;
		cursor: pointer;
		background: var(--surface);
	}
	.tb[aria-pressed='true'] {
		outline: 3px solid var(--yellow);
		outline-offset: 2px;
		box-shadow: 3px 3px 0 var(--line);
	}
	.tb img {
		width: 100%;
		height: 100%;
	}
	.summary h1 {
		font-size: clamp(1.5rem, 5vw, 2.2rem);
	}
	.bp {
		display: flex;
		flex-direction: column;
		gap: 10px;
		align-items: flex-start;
	}
	.bpr {
		gap: 10px;
	}
	.price.big {
		font-size: 2rem;
	}
	.opts {
		border: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	legend {
		font-weight: 700;
		margin-bottom: 8px;
	}
	.col .sw {
		width: 16px;
		height: 16px;
		border: 2px solid var(--line);
		border-radius: 50%;
	}
	.acts {
		gap: 10px;
	}
	.alert-form {
		display: flex;
		flex-direction: column;
		gap: 10px;
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
	.tbl-wrap {
		overflow-x: auto;
		margin: 12px 0 8px;
	}
	.cmp {
		width: 100%;
		border-collapse: collapse;
		min-width: 620px;
	}
	.cmp th,
	.cmp td {
		padding: 10px 8px;
		text-align: left;
		border-bottom: 2px solid var(--line);
		vertical-align: middle;
	}
	.cmp thead th {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom-width: var(--bw);
	}
	.cmp tr.dim {
		opacity: 0.5;
	}
	.st {
		gap: 8px;
		flex-wrap: nowrap;
	}
	.tiny {
		font-size: 0.7rem;
		padding: 1px 6px;
		margin-top: 4px;
	}
	@media (min-width: 800px) {
		.top,
		.loadgrid {
			grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
			align-items: start;
		}
	}
</style>
