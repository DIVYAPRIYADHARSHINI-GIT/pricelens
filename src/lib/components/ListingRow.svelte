<script lang="ts">
	// One store listing: badge, title, price + discount, rating, delivery, price-label sticker, Buy.
	import type { Listing, PriceLabel } from '$lib/types.ts';
	import { LABEL_TEXT } from '$lib/pricing.ts';
	import { inr } from '$lib/format.ts';
	import StoreBadge from './StoreBadge.svelte';
	import Stars from './Stars.svelte';
	import Icon from './Icon.svelte';

	let { listing, label, overBudget = false }: { listing: Listing; label: PriceLabel; overBudget?: boolean } = $props();
</script>

<li class="lr card flat" class:dim={overBudget} data-testid="listing" data-store={listing.store} data-price={listing.price} data-label={label}>
	<StoreBadge store={listing.store} name={listing.storeName} size={44} />
	<div class="info">
		<div class="row top">
			<b class="sname">{listing.storeName}</b>
			<span class="tag {label}" data-testid="price-label">{LABEL_TEXT[label]}</span>
			{#if overBudget}<span class="tag over" data-testid="over-budget">Outside budget</span>{/if}
		</div>
		<p class="title">{listing.title}</p>
		<div class="row meta">
			<Stars rating={listing.rating} count={listing.ratingCount} />
			<span class="deliv"><Icon name="truck" size={16} /> {listing.deliveryText}</span>
		</div>
	</div>
	<div class="buy">
		<div class="pr">
			<span class="price">{inr(listing.price)}</span>
			{#if listing.discountPct > 0}
				<span class="row disc"><span class="mrp">{inr(listing.mrp)}</span><b class="off mono">-{listing.discountPct}%</b></span>
			{/if}
		</div>
		<a class="btn sm yellow" href={listing.url} target="_blank" rel="noopener noreferrer" data-testid="buy">
			Buy <Icon name="external" size={16} /><span class="sr-only"> on {listing.storeName} for {inr(listing.price)} (opens in a new tab)</span>
		</a>
	</div>
</li>

<style>
	.lr {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 12px;
		align-items: start;
		padding: 12px;
		list-style: none;
	}
	.lr.dim {
		opacity: 0.5;
		background: var(--surface-2);
	}
	.lr.dim:hover,
	.lr.dim:focus-within {
		opacity: 0.85;
	}
	.info {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.top {
		gap: 8px;
	}
	.sname {
		font-size: 1.05rem;
	}
	.title {
		font-size: 0.9rem;
		color: var(--ink-2);
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	.meta {
		gap: 6px 14px;
		font-size: 0.88rem;
	}
	.deliv {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		color: var(--ink-2);
	}
	.buy {
		grid-column: 1 / -1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding-top: 10px;
		border-top: 2px dashed var(--line);
	}
	.pr {
		display: flex;
		flex-direction: column;
	}
	.price {
		font-size: 1.35rem;
	}
	.disc {
		gap: 6px;
		font-size: 0.85rem;
	}
	.off {
		color: var(--ink);
		background: var(--green);
		color: #111;
		padding: 0 5px;
		border-radius: 6px;
		border: 2px solid var(--line);
	}
	@media (min-width: 640px) {
		.lr {
			grid-template-columns: auto 1fr auto;
			align-items: center;
		}
		.buy {
			grid-column: auto;
			border-top: none;
			padding-top: 0;
			flex-direction: column;
			align-items: flex-end;
		}
		.pr {
			align-items: flex-end;
		}
	}
</style>
