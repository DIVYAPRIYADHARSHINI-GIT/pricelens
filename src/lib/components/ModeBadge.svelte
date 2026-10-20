<script lang="ts">
	import { ui } from '$lib/client/ui.svelte.ts';
	let { compact = false }: { compact?: boolean } = $props();
</script>

{#if ui.mode === 'demo'}
	<a href="/settings#data-source" class="tag demo mode" title="Using built-in sample data - no API keys needed" data-testid="demo-badge">
		<span class="pulse" aria-hidden="true"></span>{compact ? 'Demo' : 'Demo mode'}<span class="sr-only">: prices are built-in sample data</span>
	</a>
{:else}
	<a href="/settings#data-source" class="tag live mode" title="Live prices from the configured API" data-testid="live-badge">
		<span class="pulse" aria-hidden="true"></span>Live
	</a>
{/if}

<style>
	.mode {
		text-decoration: none;
		min-height: 30px;
	}
	.pulse {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #111;
	}
</style>
