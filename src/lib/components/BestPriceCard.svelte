<script lang="ts">
	// "Best price" hero card: an ink-black editorial block (inverts in dark mode)
	// with a "Cheapest ✓" seal, a big serif price and a full-width Buy button.
	import type { Listing, PriceLabel } from '$lib/types.ts';
	import { LABEL_TEXT } from '$lib/pricing.ts';
	import { inr } from '$lib/format.ts';
	import StoreBadge from './StoreBadge.svelte';
	import Stars from './Stars.svelte';
	import Icon from './Icon.svelte';

	let { listing, label = 'lowest', saving = 0, overBudget = false }: { listing: Listing; label?: PriceLabel; saving?: number; overBudget?: boolean } = $props();
</script>

<section class="best" aria-labelledby="best-h" data-testid="best-card" data-store={listing.store} data-price={listing.price}>
	<span class="stamp" aria-hidden="true">Cheapest ✓</span>
	<div class="row kick">
		<h2 id="best-h" class="kicker k">Best price</h2>
		<span class="tag" data-testid="price-label">{LABEL_TEXT[label]}</span>
	</div>
	<div class="row head">
		<StoreBadge store={listing.store} name={listing.storeName} size={48} />
		<div class="who">
			<span class="store">{listing.storeName}</span>
			<p class="title">{listing.title}</p>
		</div>
	</div>
	<div class="row priceRow">
		<span class="price big" data-testid="best-price">{inr(listing.price)}</span>
		{#if listing.discountPct > 0}
			<span class="mrp">{inr(listing.mrp)}</span>
			<span class="offb">{listing.discountPct}% off</span>
		{/if}
	</div>
	<ul class="facts">
		<li><Stars rating={listing.rating} count={listing.ratingCount} /></li>
		<li><Icon name="truck" size={15} />{listing.deliveryText}</li>
		{#if saving > 0}<li><Icon name="wallet" size={15} />Save {inr(saving)} vs priciest store</li>{/if}
		{#if overBudget}<li class="ob"><Icon name="wallet" size={15} /> Above your budget</li>{/if}
	</ul>
	<a class="btn big block buyBtn" href={listing.url} target="_blank" rel="noopener noreferrer" data-testid="best-buy">
		Buy on {listing.storeName} <Icon name="external" size={16} /><span class="sr-only"> (opens in a new tab)</span>
	</a>
</section>

<style>
	.best {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 26px 22px 22px;
		color: var(--on-ink);
		background: var(--ink);
	}
	.kick {
		gap: 10px;
	}
	.k {
		color: inherit;
		opacity: 0.75;
	}
	.best .tag {
		color: inherit;
		border-color: color-mix(in srgb, var(--on-ink) 35%, transparent);
	}
	.stamp {
		position: absolute;
		top: 18px;
		right: 18px;
		display: grid;
		place-items: center;
		width: 76px;
		height: 76px;
		padding: 8px;
		font: italic 400 0.82rem/1.1 var(--serif);
		text-align: center;
		color: inherit;
		border: 1px solid currentColor;
		border-radius: 50%;
		rotate: -10deg;
		outline: 1px solid color-mix(in srgb, var(--on-ink) 35%, transparent);
		outline-offset: -6px;
	}
	.head {
		flex-wrap: nowrap;
		gap: 14px;
		padding-right: 80px;
	}
	.head :global(.sb) {
		background: transparent;
		color: inherit;
		border-color: color-mix(in srgb, var(--on-ink) 35%, transparent);
	}
	.who {
		min-width: 0;
	}
	.store {
		font: 500 0.85rem/1.2 var(--sans);
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}
	.title {
		font-size: 0.92rem;
		opacity: 0.8;
	}
	.priceRow {
		gap: 12px;
		align-items: baseline;
	}
	.price.big {
		font-family: var(--serif);
		font-weight: 400;
		font-size: clamp(2.6rem, 11vw, 3.6rem);
		line-height: 1;
		letter-spacing: -0.01em;
	}
	.mrp {
		color: inherit;
		opacity: 0.6;
		font-size: 1rem;
	}
	.offb {
		font: 500 0.72rem/1 var(--sans);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		padding: 5px 8px;
		color: var(--ink);
		background: var(--on-ink);
	}
	.facts {
		list-style: none;
		margin: 0;
		padding: 14px 0 0;
		display: flex;
		flex-wrap: wrap;
		gap: 8px 22px;
		font-size: 0.88rem;
		border-top: 1px solid color-mix(in srgb, var(--on-ink) 22%, transparent);
	}
	.facts li {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.facts :global(.muted) {
		color: inherit;
		opacity: 0.7;
	}
	.ob {
		font-weight: 500;
	}
	.buyBtn {
		margin-top: 4px;
		color: var(--ink);
		background: var(--on-ink);
		border-color: var(--on-ink);
	}
	.buyBtn:hover {
		color: var(--on-ink);
		background: transparent;
		border-color: var(--on-ink);
	}
	@media (min-width: 640px) {
		.best {
			padding: 32px 30px 28px;
		}
	}
</style>
