<script lang="ts">
	let { rating, count = 0 }: { rating: number; count?: number } = $props();
	const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));
</script>

{#if rating > 0}
	<span class="stars" aria-label="Rated {rating.toFixed(1)} out of 5{count ? ` from ${count} reviews` : ''}">
		<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 17l-5.8 3.3 1.4-6.4L2.7 9.5l6.5-.7z" fill="currentColor" /></svg>
		<b>{rating.toFixed(1)}</b>
		{#if count}<span class="muted">({fmt(count)})</span>{/if}
	</span>
{:else}
	<span class="stars muted">No rating</span>
{/if}

<style>
	.stars {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 0.85rem;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}
	b {
		font-weight: 500;
	}
</style>
