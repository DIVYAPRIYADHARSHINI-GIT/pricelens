<script lang="ts">
	// Sort + filters (store, price range, minimum rating, brand). Pure UI: the parent owns state.
	import type { Filters, SortKey } from '$lib/pricing.ts';
	import { inr } from '$lib/format.ts';
	import Icon from './Icon.svelte';

	let {
		sort = $bindable(),
		filters = $bindable(),
		stores,
		brands,
		priceMin,
		priceMax,
		onreset
	}: {
		sort: SortKey;
		filters: Filters;
		stores: { id: string; name: string }[];
		brands: string[];
		priceMin: number;
		priceMax: number;
		onreset: () => void;
	} = $props();

	const SORTS: { key: SortKey; label: string }[] = [
		{ key: 'price', label: 'Lowest price' },
		{ key: 'rating', label: 'Highest rated' },
		{ key: 'delivery', label: 'Fastest delivery' }
	];
	const RATINGS = [0, 3, 3.5, 4, 4.5];
	const step = $derived(Math.max(10, Math.round((priceMax - priceMin) / 50 / 10) * 10 || 10));

	function toggle(list: string[], v: string): string[] {
		return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
	}
	function setMin(v: number) {
		filters.minPrice = Math.min(v, filters.maxPrice);
	}
	function setMax(v: number) {
		filters.maxPrice = Math.max(v, filters.minPrice);
	}
</script>

<div class="fp" data-testid="filter-panel">
	<fieldset>
		<legend><Icon name="sort" size={18} /> Sort by</legend>
		<div class="seg" role="radiogroup" aria-label="Sort results">
			{#each SORTS as s (s.key)}
				<button type="button" role="radio" aria-checked={sort === s.key} class="chip" class:on={sort === s.key} onclick={() => (sort = s.key)} data-testid="sort-{s.key}">{s.label}</button>
			{/each}
		</div>
	</fieldset>

	<fieldset>
		<legend><Icon name="store" size={18} /> Stores</legend>
		<div class="chips">
			{#each stores as s (s.id)}
				<button type="button" class="chip" aria-pressed={filters.stores.includes(s.id)} onclick={() => (filters.stores = toggle(filters.stores, s.id))} data-testid="f-store-{s.id}">{s.name}</button>
			{/each}
		</div>
		<p class="hint muted">{filters.stores.length ? `${filters.stores.length} selected` : 'All stores'}</p>
	</fieldset>

	<fieldset>
		<legend><Icon name="wallet" size={18} /> Price range</legend>
		<p class="mono range-val" aria-live="polite"><b>{inr(filters.minPrice)}</b> – <b>{inr(filters.maxPrice)}</b></p>
		<label class="rl">
			<span>Min</span>
			<input type="range" min={priceMin} max={priceMax} {step} value={filters.minPrice} oninput={(e) => setMin(Number(e.currentTarget.value))} aria-label="Minimum price" aria-valuetext={inr(filters.minPrice)} data-testid="f-min" />
		</label>
		<label class="rl">
			<span>Max</span>
			<input type="range" min={priceMin} max={priceMax} {step} value={filters.maxPrice} oninput={(e) => setMax(Number(e.currentTarget.value))} aria-label="Maximum price" aria-valuetext={inr(filters.maxPrice)} data-testid="f-max" />
		</label>
	</fieldset>

	<fieldset>
		<legend><Icon name="star" size={18} /> Minimum rating</legend>
		<div class="chips">
			{#each RATINGS as r (r)}
				<button type="button" class="chip" aria-pressed={filters.minRating === r} onclick={() => (filters.minRating = r)} data-testid="f-rating-{String(r).replace('.', '_')}">{r === 0 ? 'Any' : `${r}★ +`}</button>
			{/each}
		</div>
	</fieldset>

	{#if brands.length > 1}
		<fieldset>
			<legend><Icon name="tag" size={18} /> Brand</legend>
			<div class="chips">
				{#each brands as b (b)}
					<button type="button" class="chip" aria-pressed={filters.brands.includes(b)} onclick={() => (filters.brands = toggle(filters.brands, b))} data-testid="f-brand">{b}</button>
				{/each}
			</div>
		</fieldset>
	{/if}

	<button type="button" class="btn sm" onclick={onreset} data-testid="f-reset"><Icon name="refresh" size={16} /> Reset filters</button>
</div>

<style>
	.fp {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	fieldset {
		border: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 0;
	}
	legend {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-weight: 700;
		margin-bottom: 8px;
	}
	.chips,
	.seg {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.chip {
		font-size: 0.88rem;
		padding: 8px 12px;
	}
	.hint {
		font-size: 0.82rem;
	}
	.range-val {
		font-size: 0.95rem;
	}
	.rl {
		display: grid;
		grid-template-columns: 38px 1fr;
		align-items: center;
		gap: 8px;
		font-weight: 700;
		font-size: 0.85rem;
	}
</style>
