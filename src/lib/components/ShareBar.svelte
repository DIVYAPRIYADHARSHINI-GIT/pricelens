<script lang="ts">
	// Share result (copy link + native share), WhatsApp pre-filled message, copy comparison text.
	import type { Listing, Product } from '$lib/types.ts';
	import { bestListing, comparisonText, shareMessage, whatsappUrl } from '$lib/pricing.ts';
	import { copyText, ui } from '$lib/client/ui.svelte.ts';
	import Icon from './Icon.svelte';

	let { product, listings }: { product: Product; listings: Listing[] } = $props();

	const link = $derived.by(() => {
		const origin = typeof location !== 'undefined' ? location.origin : '';
		if (product.source === 'demo') return `${origin}/product/${product.id}`;
		return `${origin}/results?q=${encodeURIComponent(product.name)}`;
	});
	const best = $derived(bestListing(listings) ?? bestListing(product.listings));
	const message = $derived(shareMessage(product, best, link));

	async function shareLink() {
		const ok = await copyText(link);
		ui.toast(ok ? 'Link copied - paste it anywhere!' : "Couldn't copy - long-press the address bar to copy.", ok ? 'ok' : 'err');
	}
	async function nativeShare() {
		try {
			await navigator.share({ title: `PriceLens: ${product.name}`, text: message, url: link });
		} catch {
			/* user cancelled */
		}
	}
	async function copyComparison() {
		const ok = await copyText(comparisonText(product, listings.length ? listings : product.listings, link));
		ui.toast(ok ? 'Comparison copied as text.' : "Couldn't copy the comparison.", ok ? 'ok' : 'err');
	}
	const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
</script>

<div class="share" data-testid="share-bar">
	<button type="button" class="btn sm blue wobble" onclick={shareLink} data-testid="share-link"><Icon name="link" size={18} /> Share result</button>
	<a class="btn sm green wobble" href={whatsappUrl(message)} target="_blank" rel="noopener noreferrer" data-testid="share-whatsapp"><Icon name="whatsapp" size={18} /> Share on WhatsApp<span class="sr-only"> (opens in a new tab)</span></a>
	<button type="button" class="btn sm wobble" onclick={copyComparison} data-testid="copy-comparison"><Icon name="copy" size={18} /> Copy comparison</button>
	{#if canShare}
		<button type="button" class="btn sm icon-only" onclick={nativeShare} aria-label="More share options" data-testid="share-native"><Icon name="share" size={18} /></button>
	{/if}
</div>

<style>
	.share {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
</style>
