<script lang="ts">
	// Horizontal product carousel: portrait 3:4 tiles, uppercase brand, name and
	// price under the image (fashion "shop the look" rail). Native scroll-snap +
	// prev/next buttons, keyboard friendly.
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
	<div class="sec-head">
		<div>
			<span class="kicker">{showSavings ? 'For less' : 'You may also like'}</span>
			<h2 id="{testid}-h">{title}</h2>
		</div>
		<div class="row nav">
			<button type="button" class="btn sm icon-only quiet" aria-label="Scroll {title} left" onclick={() => scrollBy(-1)}><Icon name="chevronLeft" size={18} /></button>
			<button type="button" class="btn sm icon-only quiet" aria-label="Scroll {title} right" onclick={() => scrollBy(1)}><Icon name="chevronRight" size={18} /></button>
		</div>
	</div>
	{#if items.length === 0}
		<p class="muted empty">Nothing here yet for this product.</p>
	{:else}
		<div class="track" bind:this={track} role="list">
			{#each items as s (s.id)}
				{@const save = Math.max(0, reference - s.price)}
				<article class="sc" role="listitem" data-testid="suggestion">
					<a class="cover" href={s.hasDetail ? `/product/${s.id}` : s.url} target={s.hasDetail ? undefined : '_blank'} rel={s.hasDetail ? undefined : 'noopener noreferrer'}>
						<span class="ph zoom">
							<img src={s.image} alt="{s.name} - placeholder image" width="240" height="320" />
							{#if showSavings && save > 0}<span class="save" data-testid="saving">You save {inr(save)}</span>{/if}
						</span>
						<span class="brand">{s.brand}</span>
						<span class="name">{s.name}</span>
					</a>
					<div class="row pr">
						<span class="price">{inr(s.price)}</span>
						{#if s.mrp > s.price}<span class="mrp">{inr(s.mrp)}</span>{/if}
					</div>
					<span class="muted small">{s.storeName} · <Stars rating={s.rating} /></span>
				</article>
			{/each}
		</div>
	{/if}
</section>

<style>
	.carousel {
		display: flex;
		flex-direction: column;
		gap: 18px;
		min-width: 0;
	}
	.nav {
		gap: 6px;
	}
	.track {
		display: flex;
		gap: 16px;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		padding: 0 2px 12px;
		scrollbar-width: thin;
		overscroll-behavior-x: contain;
	}
	.sc {
		flex: 0 0 min(46vw, 220px);
		scroll-snap-align: start;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.cover {
		display: flex;
		flex-direction: column;
		gap: 4px;
		text-decoration: none;
		color: var(--ink);
	}
	.ph {
		position: relative;
		display: block;
		aspect-ratio: 3 / 4;
		margin-bottom: 8px;
		background: var(--surface-2);
	}
	.ph img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.save {
		position: absolute;
		left: 0;
		bottom: 0;
		padding: 6px 10px;
		font: 500 0.66rem/1.2 var(--sans);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--on-ink);
		background: var(--ink);
	}
	.brand {
		font: 500 0.68rem/1.2 var(--sans);
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.name {
		font-size: 0.92rem;
		line-height: 1.3;
		min-height: 2.6em;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.cover:hover .name {
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.pr {
		gap: 8px;
	}
	.small {
		font-size: 0.8rem;
		display: inline-flex;
		gap: 4px;
		align-items: center;
		flex-wrap: wrap;
	}
	.empty {
		padding: 8px 0;
	}
</style>
