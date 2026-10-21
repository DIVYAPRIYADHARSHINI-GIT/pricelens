<script lang="ts">
	import { ui } from '$lib/client/ui.svelte.ts';
	let { compact = false }: { compact?: boolean } = $props();
</script>

{#if ui.mode === 'demo'}
	<a href="/settings#data-source" class="tag demo mode" title="Using built-in sample data - no API keys needed" data-testid="demo-badge">
		<span class="dot" aria-hidden="true"></span>{compact ? 'Demo' : 'Demo mode'}<span class="sr-only">: prices are built-in sample data</span>
	</a>
{:else}
	<a href="/settings#data-source" class="tag live mode" title="Live prices from the configured API" data-testid="live-badge">
		<span class="dot live" aria-hidden="true"></span>Live
	</a>
{/if}

<style>
	.mode {
		text-decoration: none;
		min-height: 28px;
	}
	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--sale);
	}
	.dot.live {
		background: var(--sage-fg);
	}
</style>
