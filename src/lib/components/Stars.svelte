<script lang="ts">
	let { rating, count = 0 }: { rating: number; count?: number } = $props();
	const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));
</script>

{#if rating > 0}
	<span class="stars" aria-label="Rated {rating.toFixed(1)} out of 5{count ? ` from ${count} reviews` : ''}">
		<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" fill="#FFD60A" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" /></svg>
		<b class="mono">{rating.toFixed(1)}</b>
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
		font-size: 0.9rem;
		white-space: nowrap;
	}
</style>
