<script lang="ts">
	// Empty / no-result / error state card with a small custom SVG icon.
	import type { Snippet } from 'svelte';
	import Icon, { type IconName } from './Icon.svelte';
	let {
		icon,
		title,
		message = '',
		tone = 'yellow',
		testid = 'state-card',
		children
	}: { icon: IconName; title: string; message?: string; tone?: 'yellow' | 'pink' | 'blue' | 'green' | 'orange'; testid?: string; children?: Snippet } = $props();
</script>

<section class="card state" data-testid={testid} aria-live="polite">
	<div class="ic" style="--tone: var(--{tone})"><Icon name={icon} size={38} stroke={2.6} /></div>
	<h2>{title}</h2>
	{#if message}<p class="muted">{message}</p>{/if}
	{#if children}<div class="actions">{@render children()}</div>{/if}
</section>

<style>
	.state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 12px;
		padding: 28px 18px;
	}
	.ic {
		display: grid;
		place-items: center;
		width: 76px;
		height: 76px;
		color: #111;
		background: var(--tone);
		border: var(--bw) solid var(--line);
		border-radius: 22px;
		box-shadow: var(--shadow-sm);
		rotate: -4deg;
	}
	p {
		max-width: 42ch;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 10px;
		margin-top: 6px;
	}
</style>
