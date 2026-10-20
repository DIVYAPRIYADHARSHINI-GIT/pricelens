<script lang="ts">
	// Green "Best price" card with a "Cheapest ✓" stamp.
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
	<div class="row">
		<h2 id="best-h" class="kicker">Best price</h2>
		<span class="tag {label}" data-testid="price-label">{LABEL_TEXT[label]}</span>
	</div>
	<div class="row head">
		<StoreBadge store={listing.store} name={listing.storeName} size={52} />
		<div>
			<b class="store">{listing.storeName}</b>
			<p class="title">{listing.title}</p>
		</div>
	</div>
	<div class="row priceRow">
		<span class="price big" data-testid="best-price">{inr(listing.price)}</span>
		{#if listing.discountPct > 0}
			<span class="mrp">{inr(listing.mrp)}</span>
			<span class="tag lowest">{listing.discountPct}% off</span>
		{/if}
	</div>
	<div class="row facts">
		<Stars rating={listing.rating} count={listing.ratingCount} />
		<span class="row d"><Icon name="truck" size={18} />{listing.deliveryText}</span>
		{#if saving > 0}<span class="row d"><Icon name="wallet" size={18} />Save <b class="mono">{inr(saving)}</b> vs priciest store</span>{/if}
	</div>
	{#if overBudget}<p class="ob"><Icon name="wallet" size={16} /> Above your budget</p>{/if}
	<a class="btn big ink block buyBtn" href={listing.url} target="_blank" rel="noopener noreferrer" data-testid="best-buy">
		Buy on {listing.storeName} <Icon name="external" size={20} /><span class="sr-only"> (opens in a new tab)</span>
	</a>
</section>

<style>
	.best {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 18px;
		color: #111;
		background: var(--green);
		border: var(--bw) solid var(--line);
		border-radius: 20px;
		box-shadow: var(--shadow-lg);
	}
	:global(html[data-theme='dark']) .best {
		box-shadow: 8px 8px 0 var(--green);
		border-color: var(--green);
		background: #0f2a18;
		color: var(--ink);
	}
	.kicker {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
	.stamp {
		position: absolute;
		top: -14px;
		right: 14px;
		padding: 6px 12px;
		font: 700 0.95rem var(--mono);
		color: #111;
		background: var(--yellow);
		border: var(--bw) solid #111;
		border-radius: 10px;
		box-shadow: 3px 3px 0 #111;
		rotate: 6deg;
	}
	.head {
		flex-wrap: nowrap;
		gap: 12px;
	}
	.store {
		font-size: 1.3rem;
	}
	.title {
		font-size: 0.92rem;
		opacity: 0.85;
	}
	.priceRow {
		gap: 10px;
	}
	.price.big {
		font-size: clamp(2rem, 9vw, 2.6rem);
		line-height: 1;
	}
	.mrp {
		color: inherit;
		opacity: 0.7;
	}
	.facts {
		gap: 8px 16px;
		font-weight: 500;
	}
	.d {
		gap: 5px;
		flex-wrap: nowrap;
	}
	.ob {
		display: inline-flex;
		gap: 6px;
		align-items: center;
		font-weight: 700;
	}
	.buyBtn {
		margin-top: 4px;
		--btn-bg: #111;
		--btn-fg: #fff;
	}
	:global(html[data-theme='dark']) .buyBtn {
		--btn-bg: var(--green);
		--btn-fg: #0a0a0a;
	}
</style>
