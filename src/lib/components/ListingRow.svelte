<script lang="ts">
	// One store listing as an editorial table row: monogram, store + title, meta,
	// price (MRP struck through, discount in the sale colour), label, Buy.
	import type { Listing, PriceLabel } from '$lib/types.ts';
	import { LABEL_TEXT } from '$lib/pricing.ts';
	import { inr } from '$lib/format.ts';
	import StoreBadge from './StoreBadge.svelte';
	import Stars from './Stars.svelte';
	import Icon from './Icon.svelte';

	let { listing, label, overBudget = false }: { listing: Listing; label: PriceLabel; overBudget?: boolean } = $props();
</script>

<li class="lr" class:dim={overBudget} data-testid="listing" data-store={listing.store} data-price={listing.price} data-label={label}>
	<StoreBadge store={listing.store} name={listing.storeName} size={44} />
	<div class="info">
		<div class="row top">
			<span class="sname">{listing.storeName}</span>
			<span class="tag {label}" data-testid="price-label">{LABEL_TEXT[label]}</span>
			{#if overBudget}<span class="tag over" data-testid="over-budget">Outside budget</span>{/if}
		</div>
		<p class="title">{listing.title}</p>
		<div class="row meta">
			<Stars rating={listing.rating} count={listing.ratingCount} />
			<span class="deliv"><Icon name="truck" size={15} /> {listing.deliveryText}</span>
		</div>
	</div>
	<div class="buy">
		<div class="pr">
			<span class="price">{inr(listing.price)}</span>
			{#if listing.discountPct > 0}
				<span class="row disc"><span class="mrp">{inr(listing.mrp)}</span><span class="off">−{listing.discountPct}%</span></span>
			{/if}
		</div>
		<a class="btn sm" href={listing.url} target="_blank" rel="noopener noreferrer" data-testid="buy">
			Buy<span class="sr-only"> on {listing.storeName} for {inr(listing.price)} (opens in a new tab)</span>
		</a>
	</div>
</li>

<style>
	.lr {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 14px;
		align-items: start;
		padding: 18px 0;
		list-style: none;
		border-bottom: 1px solid var(--hair);
		transition: opacity 0.2s var(--ease);
	}
	.lr.dim {
		opacity: 0.42;
	}
	.lr.dim:hover,
	.lr.dim:focus-within {
		opacity: 0.85;
	}
	.info {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 5px;
	}
	.top {
		gap: 8px;
	}
	.sname {
		font: 500 0.78rem/1.2 var(--sans);
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}
	.title {
		font-size: 0.92rem;
		color: var(--ink-2);
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	.meta {
		gap: 4px 16px;
		font-size: 0.84rem;
		color: var(--ink-2);
	}
	.deliv {
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}
	.buy {
		grid-column: 1 / -1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	.pr {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.price {
		font-size: 1.2rem;
	}
	.disc {
		gap: 8px;
		font-size: 0.85rem;
	}
	@media (min-width: 640px) {
		.lr {
			grid-template-columns: auto 1fr auto;
			align-items: center;
			gap: 18px;
		}
		.buy {
			grid-column: auto;
			gap: 18px;
		}
		.pr {
			align-items: flex-end;
		}
	}
</style>
