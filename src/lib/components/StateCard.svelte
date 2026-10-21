<script lang="ts">
	// Empty / no-result / error state: an editorial block with a fine-line icon,
	// serif headline and centred actions. `tone` is kept for API compatibility and
	// only switches the icon ring to the "sale" colour for warnings.
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
	const warn = $derived(tone === 'orange' || tone === 'pink');
</script>

<section class="state" data-testid={testid} aria-live="polite">
	<div class="ic" class:warn><Icon name={icon} size={28} stroke={1.25} /></div>
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
		gap: 14px;
		padding: 48px 20px;
		border-top: 1px solid var(--hair);
		border-bottom: 1px solid var(--hair);
	}
	.ic {
		display: grid;
		place-items: center;
		width: 64px;
		height: 64px;
		color: var(--ink);
		border: 1px solid var(--ink);
		border-radius: 50%;
	}
	.ic.warn {
		color: var(--sale);
		border-color: var(--sale);
	}
	h2 {
		font-size: clamp(1.6rem, 5vw, 2.2rem);
	}
	p {
		max-width: 44ch;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 10px;
		margin-top: 8px;
	}
</style>
