<script lang="ts">
	// Results for one product. Keyed by product id in the parent, so the filter state
	// below is initialised once per product (no effects that write state).
	import type { Category, Product, SearchResponse } from '$lib/types.ts';
	import { CATEGORY_LABEL } from '$lib/types.ts';
	import { applyFilters, bestListing, budgetState, defaultFilters, priceLabel, priceStats, sortListings, type Filters, type SortKey } from '$lib/pricing.ts';
	import { inr } from '$lib/format.ts';
	import { storeMeta } from '$lib/stores.ts';
	import { store } from '$lib/client/store.svelte.ts';
	import { search } from '$lib/client/search.svelte.ts';
	import { ui } from '$lib/client/ui.svelte.ts';
	import BestPriceCard from './BestPriceCard.svelte';
	import ListingRow from './ListingRow.svelte';
	import FilterPanel from './FilterPanel.svelte';
	import Carousel from './Carousel.svelte';
	import ShareBar from './ShareBar.svelte';
	import EditSearch from './EditSearch.svelte';
	import StateCard from './StateCard.svelte';
	import Icon from './Icon.svelte';

	let { result, product, preview }: { result: SearchResponse; product: Product; preview: string | null } = $props();

	// svelte-ignore state_referenced_locally
	const initial = defaultFilters(product.listings);
	let filters = $state<Filters>({ ...initial });
	let sort = $state<SortKey>('price');
	let editing = $state(false);
	let showFilters = $state(false);

	const settings = $derived(store.data.settings);
	const budget = $derived({ min: settings.budgetMin, max: settings.budgetMax, hideOutside: settings.hideOutsideBudget });
	const hasBudget = $derived(budget.min > 0 || budget.max > 0);
	/** Listings minus stores the user hid in Settings. */
	const pool = $derived(product.listings.filter((l) => !settings.hiddenStores.includes(l.store)));
	const hiddenCount = $derived(product.listings.length - pool.length);
	const filtered = $derived(applyFilters(pool, filters).filter((l) => !(budget.hideOutside && budgetState(l.price, budget) !== 'ok')));
	const sorted = $derived(sortListings(filtered, sort));
	const best = $derived(bestListing(filtered));
	const others = $derived(sorted.filter((l) => l.id !== best?.id));
	const stats = $derived(priceStats(pool));
	const overAll = $derived(pool.length > 0 && pool.every((l) => budgetState(l.price, budget) !== 'ok'));
	const storesInResult = $derived([...new Map(pool.map((l) => [l.store, { id: l.store, name: storeMeta(l.store, l.storeName).name }])).values()]);
	const brands = $derived([...new Set(pool.map((l) => l.brand))].sort());
	const activeFilters = $derived(filters.stores.length + filters.brands.length + (filters.minRating > 0 ? 1 : 0) + (filters.minPrice > initial.minPrice || filters.maxPrice < initial.maxPrice ? 1 : 0));
	const saved = $derived(store.isSaved(product.id));
	const image = $derived(preview ?? product.images[0]);
	const detected = $derived(result.detected);

	function resetFilters() {
		filters = { ...initial };
		sort = 'price';
	}
	function toggleSave() {
		const now = store.toggleWish(product, search.query || result.query);
		ui.toast(now ? `Saved to wishlist at ${inr(bestListing(product.listings)?.price)}.` : 'Removed from wishlist.', now ? 'ok' : 'info');
	}
	function correct(q: string, c: Category | null) {
		editing = false;
		void search.correct(q, c);
	}
</script>

<!-- Top card: scanned image, detected name + category, edit -->
<section class="card top" aria-labelledby="det-h" data-testid="detected-card">
	<img class="thumb scan-img" src={image} alt={preview ? `Your photo of ${product.name}` : `${product.name} - placeholder image`} width="112" height="112" />
	<div class="det">
		<p class="row kick">
			<span class="tag">{CATEGORY_LABEL[product.category]}</span>
			{#if detected.method === 'colour' || detected.method === 'vision'}
				<span class="tag" title="Detection confidence">Match {Math.round(detected.confidence * 100)}%</span>
			{/if}
			{#if detected.colour}<span class="tag"><span class="sw" style="background:{detected.colour.hex}" aria-hidden="true"></span>{detected.colour.name}</span>{/if}
		</p>
		<h1 id="det-h" data-testid="page-title">{product.name}</h1>
		<p class="muted">{pool.length} store{pool.length === 1 ? '' : 's'} · {inr(stats.min)} – {inr(stats.max)}{hiddenCount ? ` · ${hiddenCount} hidden by your store settings` : ''}</p>
	</div>
	<div class="top-actions">
		<button type="button" class="btn sm" onclick={() => (editing = !editing)} aria-expanded={editing} data-testid="edit-detected"><Icon name="edit" size={18} /> Edit</button>
		<button type="button" class="btn sm {saved ? 'pink' : ''}" onclick={toggleSave} aria-pressed={saved} data-testid="save-wishlist"><Icon name="heart" size={18} /> {saved ? 'Saved' : 'Save'}</button>
		<a class="btn sm blue" href="/product/{product.id}" data-testid="open-detail"><Icon name="chart" size={18} /> Details</a>
	</div>
	{#if editing}
		<div class="edit-wrap">
			<p class="muted">Not the right product? Pick a category or describe it and we'll search again.</p>
			<EditSearch initialQuery={result.query === product.name ? '' : result.query} initialCategory={product.category} onsubmit={correct} oncancel={() => (editing = false)} />
		</div>
	{/if}
</section>

{#if result.notice}<p class="note" role="status"><Icon name="sparkle" size={18} /> {result.notice}</p>{/if}

<div class="grid">
	<div class="main stack">
		{#if best}
			<BestPriceCard listing={best} label={priceLabel(best.price, pool)} saving={Math.max(0, stats.max - best.price)} overBudget={budgetState(best.price, budget) !== 'ok'} />
		{/if}

		{#if hasBudget}
			<div class="budget card flat" data-testid="budget-bar">
				<span><Icon name="wallet" size={18} /> Budget <b class="mono">{budget.min ? inr(budget.min) : '₹0'} – {budget.max ? inr(budget.max) : 'any'}</b></span>
				<label class="switch"><input type="checkbox" checked={settings.hideOutsideBudget} onchange={(e) => store.updateSettings({ hideOutsideBudget: e.currentTarget.checked })} data-testid="hide-over-budget" /> Hide outside budget</label>
			</div>
			{#if overAll}
				<p class="note" data-testid="all-over-budget"><Icon name="wallet" size={18} /> Every store is outside your budget for this one - check the cheaper alternatives below.</p>
			{/if}
		{/if}

		<div class="spread">
			<h2>{best ? 'Other stores' : 'Stores'}</h2>
			<button type="button" class="btn sm filter-toggle" onclick={() => (showFilters = !showFilters)} aria-expanded={showFilters} aria-controls="filters" data-testid="toggle-filters">
				<Icon name="filter" size={18} /> Sort & filter{activeFilters ? ` (${activeFilters})` : ''}
			</button>
		</div>

		{#if filtered.length === 0}
			<StateCard icon="filter" tone="blue" title="No stores match" message="Your filters, budget or store settings hide every listing for this product." testid="no-match">
				<button type="button" class="btn yellow" onclick={resetFilters} data-testid="no-match-reset">Reset filters</button>
				{#if budget.hideOutside}<button type="button" class="btn" onclick={() => store.updateSettings({ hideOutsideBudget: false })}>Show outside budget</button>{/if}
				<a class="btn" href="/settings">Store settings</a>
			</StateCard>
		{:else if others.length === 0}
			<p class="muted">Only one store matches right now.</p>
		{:else}
			<ul class="listings" data-testid="listings">
				{#each others as l (l.id)}
					<ListingRow listing={l} label={priceLabel(l.price, pool)} overBudget={budgetState(l.price, budget) !== 'ok'} />
				{/each}
			</ul>
		{/if}

		<p class="note" data-testid="indicative-note"><Icon name="help" size={18} /> Prices are indicative and may change on the store's site.</p>

		<ShareBar {product} listings={sorted.length ? sorted : pool} />
	</div>

	<aside class="side card" id="filters" class:open={showFilters} aria-label="Sort and filter">
		<FilterPanel bind:sort bind:filters stores={storesInResult} {brands} priceMin={initial.minPrice} priceMax={initial.maxPrice} onreset={resetFilters} />
	</aside>
</div>

<Carousel title="Similar styles" items={result.similar} testid="similar" />
<Carousel title="Cheaper alternatives" items={result.cheaper} reference={stats.min} showSavings testid="cheaper" />

<style>
	.top {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 14px;
		align-items: center;
	}
	.scan-img {
		width: 96px;
		height: 96px;
		object-fit: cover;
	}
	.det {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}
	.det h1 {
		font-size: clamp(1.25rem, 5vw, 1.9rem);
		overflow-wrap: anywhere;
	}
	.kick {
		gap: 6px;
	}
	.sw {
		width: 12px;
		height: 12px;
		border: 2px solid var(--line);
		border-radius: 50%;
	}
	.top-actions {
		grid-column: 1 / -1;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.edit-wrap {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding-top: 12px;
		border-top: 2px dashed var(--line);
	}
	.grid {
		display: grid;
		gap: 20px;
		align-items: start;
	}
	.main {
		gap: 16px;
		min-width: 0;
	}
	.listings {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.budget {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 8px;
		padding: 8px 14px;
	}
	.budget span {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.side {
		display: none;
		order: -1;
	}
	.side.open {
		display: block;
	}
	@media (min-width: 640px) {
		.top {
			grid-template-columns: auto 1fr auto;
		}
		.scan-img {
			width: 112px;
			height: 112px;
		}
		.top-actions {
			grid-column: auto;
			flex-direction: column;
			align-items: stretch;
		}
	}
	@media (min-width: 1024px) {
		.grid {
			grid-template-columns: minmax(0, 1fr) 300px;
		}
		.side {
			display: block;
			order: 0;
			position: sticky;
			top: 20px;
		}
		.filter-toggle {
			display: none;
		}
	}
</style>
