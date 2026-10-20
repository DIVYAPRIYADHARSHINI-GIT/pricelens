<script lang="ts">
	// Horizontal card carousel (native scroll-snap + prev/next buttons, keyboard friendly).
	import type { Suggestion } from '$lib/types.ts';
	import { inr } from '$lib/format.ts';
	import Icon from './Icon.svelte';
	import Stars from './Stars.svelte';

	let { title, items, reference = 0, showSavings = false, testid }: { title: string; items: Suggestion[]; reference?: number; showSavings?: boolean; testid: string } = $props();
	let track: HTMLDivElement | undefined = $state();

	function scrollBy(dir: number) {
		track?.scrollBy({ left: dir * Math.max(200, track.clientWidth * 0.8), behavior: 'smooth' });
	}
</script>

<section class="carousel" aria-labelledby="{testid}-h" data-testid={testid}>
	<div class="spread">
		<h2 id="{testid}-h">{title}</h2>
		<div class="row nav">
			<button type="button" class="btn sm icon-only" aria-label="Scroll {title} left" onclick={() => scrollBy(-1)}><Icon name="chevronLeft" size={20} /></button>
			<button type="button" class="btn sm icon-only" aria-label="Scroll {title} right" onclick={() => scrollBy(1)}><Icon name="chevronRight" size={20} /></button>
		</div>
	</div>
	{#if items.length === 0}
		<p class="muted empty">Nothing here yet for this product.</p>
	{:else}
		<div class="track" bind:this={track} role="list">
			{#each items as s (s.id)}
				{@const save = Math.max(0, reference - s.price)}
				<article class="sc card wobble" role="listitem" data-testid="suggestion">
					<a class="cover" href={s.hasDetail ? `/product/${s.id}` : s.url} target={s.hasDetail ? undefined : '_blank'} rel={s.hasDetail ? undefined : 'noopener noreferrer'}>
						<img class="thumb" src={s.image} alt="{s.name} - placeholder image" width="160" height="160" />
						<span class="name">{s.name}</span>
					</a>
					<div class="row pr">
						<span class="price">{inr(s.price)}</span>
						{#if s.mrp > s.price}<span class="mrp">{inr(s.mrp)}</span>{/if}
					</div>
					<span class="muted small">{s.storeName} · <Stars rating={s.rating} /></span>
					{#if showSavings && save > 0}
						<span class="tag lowest save" data-testid="saving">You save {inr(save)}</span>
					{/if}
				</article>
			{/each}
		</div>
	{/if}
</section>

<style>
	.carousel {
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-width: 0;
	}
	.nav {
		gap: 8px;
	}
	.track {
		display: flex;
		gap: 14px;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		padding: 4px 8px 14px 2px;
		scrollbar-width: thin;
		overscroll-behavior-x: contain;
	}
	.sc {
		flex: 0 0 172px;
		scroll-snap-align: start;
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 10px;
		box-shadow: var(--shadow-sm);
	}
	.cover {
		display: flex;
		flex-direction: column;
		gap: 8px;
		text-decoration: none;
		color: var(--ink);
	}
	.cover img {
		width: 100%;
		height: auto;
	}
	.name {
		font-weight: 700;
		font-size: 0.92rem;
		line-height: 1.2;
		min-height: 2.4em;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.pr {
		gap: 6px;
	}
	.price {
		font-size: 1.1rem;
	}
	.small {
		font-size: 0.82rem;
		display: inline-flex;
		gap: 4px;
		align-items: center;
		flex-wrap: wrap;
	}
	.save {
		align-self: flex-start;
	}
	.empty {
		padding: 8px 0;
	}
</style>
