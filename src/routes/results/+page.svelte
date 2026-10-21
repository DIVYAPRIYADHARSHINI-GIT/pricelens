<script lang="ts">
	// Results: loading skeleton -> "Not sure what this is?" / error states / results.
	// `/results?q=...` runs a text search (used by shared links of live results).
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { search } from '$lib/client/search.svelte.ts';
	import ResultsView from '$lib/components/ResultsView.svelte';
	import EditSearch from '$lib/components/EditSearch.svelte';
	import StateCard from '$lib/components/StateCard.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type { Category } from '$lib/types.ts';
	import { CATEGORY_LABEL } from '$lib/types.ts';

	onMount(() => {
		const q = page.url.searchParams.get('q');
		if (q && q.trim()) {
			void search.fromText(q.slice(0, 120));
			void goto('/results', { replaceState: true, keepFocus: true, noScroll: true });
		}
	});

	const phase = $derived(search.phase);
	const result = $derived(search.result);
	const product = $derived(result?.product ?? null);
	const detected = $derived(result?.detected);
	const busy = $derived(phase === 'processing' || phase === 'searching');

	function correct(q: string, c: Category | null) {
		void search.correct(q, c);
	}
	const ERR: Record<string, { icon: 'wifiOff' | 'file' | 'camera' | 'help' | 'refresh'; title: string; tone: 'orange' | 'pink' | 'blue' }> = {
		offline: { icon: 'wifiOff', title: 'No internet connection', tone: 'orange' },
		unsupported: { icon: 'file', title: 'Unsupported file', tone: 'pink' },
		'too-large': { icon: 'file', title: 'That photo is too big', tone: 'pink' },
		'rate-limited': { icon: 'refresh', title: 'Slow down a little', tone: 'blue' },
		server: { icon: 'help', title: 'Something went wrong', tone: 'orange' },
		camera: { icon: 'camera', title: 'Camera access is blocked', tone: 'orange' }
	};
</script>

<div class="page results">
	{#if busy}
		<section class="loading-wrap" aria-busy="true" aria-live="polite" data-testid="search-loading">
			<div class="load-top">
				{#if search.preview}
					<img class="pv" src={search.preview} alt="Your scanned product" width="120" height="160" data-testid="preview" />
				{:else}
					<div class="skeleton pv" aria-hidden="true"></div>
				{/if}
				<div class="lt">
					<span class="kicker">One moment</span>
					<h1 data-testid="page-title">{phase === 'processing' ? 'Getting your photo ready…' : 'Comparing prices…'}</h1>
					<p class="msg" data-testid="loading-message">{search.message}</p>
					<div class="bar" aria-hidden="true"><span></span></div>
				</div>
			</div>
			<div class="skeleton" style="height: 240px" aria-hidden="true"></div>
			<div class="skeleton" style="height: 72px" aria-hidden="true"></div>
			<div class="skeleton" style="height: 72px" aria-hidden="true"></div>
			<div class="sk-row" aria-hidden="true">
				{#each [1, 2, 3] as i (i)}<div class="skeleton" style="aspect-ratio: 3 / 4"></div>{/each}
			</div>
		</section>
	{:else if phase === 'error' && search.error}
		{@const e = ERR[search.error.kind] ?? ERR.server}
		<h1 class="sr-only" data-testid="page-title">{e.title}</h1>
		<StateCard icon={e.icon} tone={e.tone} title={e.title} message={search.error.message} testid="error-{search.error.kind}">
			{#if search.error.kind === 'offline' || search.error.kind === 'server' || search.error.kind === 'rate-limited'}
				<button type="button" class="btn primary" onclick={() => search.retry()} data-testid="retry"><Icon name="refresh" size={16} /> Try again</button>
			{/if}
			<a class="btn" href="/" onclick={() => search.reset()} data-testid="back-scan"><Icon name="camera" size={16} /> Scan another photo</a>
		</StateCard>
	{:else if phase === 'uncertain' && result}
		<section class="unsure" data-testid="not-sure">
			<div class="unsure-head">
				{#if search.preview}
					<img class="pv" src={search.preview} alt="What you scanned" width="120" height="160" />
				{/if}
				<div>
					{#if detected?.reason === 'blurry'}
						<p class="tag above"><Icon name="blur" size={14} /> Blurry photo</p>
					{:else if detected?.reason === 'no-product' && result.query}
						<p class="tag above">No results for "{result.query}"</p>
					{:else if detected?.label && detected.reason === 'low-confidence'}
						<p class="tag">Best guess: {detected.label}{detected.colour ? ` (${detected.colour.name.toLowerCase()})` : ''}</p>
					{/if}
					<h1 data-testid="page-title">Not sure what this is?</h1>
					<p class="muted">
						{#if detected?.reason === 'blurry'}
							Your photo looks blurry. Pick what it is below, or retake it in good light and hold the phone steady.
						{:else if detected?.reason === 'no-product' && result.query}
							We couldn't match that search. Try a category or different words.
						{:else}
							We couldn't tell for sure. Help us out - pick a category or describe it.
						{/if}
					</p>
				</div>
			</div>
			{#key result}
				<EditSearch initialQuery="" initialCategory={detected?.reason === 'low-confidence' ? (detected.category ?? null) : null} submitLabel="Find prices" onsubmit={correct} />
			{/key}
			<div class="row">
				<a class="textlink" href="/" onclick={() => search.reset()} data-testid="retake"><Icon name="camera" size={14} /> Retake photo</a>
			</div>
			<p class="muted fine">Demo tip: the sample catalog has dresses, shoes, bags, headphones and watches. Other categories show a no-results state.</p>
		</section>
	{:else if result && product}
		{#key product.id}
			<ResultsView {result} {product} preview={search.preview} />
		{/key}
	{:else}
		<h1 class="sr-only" data-testid="page-title">Results</h1>
		<StateCard icon="search" title="No results yet" message="Scan or upload a product photo, or type what you're looking for. Results show up here." testid="results-empty">
			<a class="btn primary" href="/" data-testid="go-scan"><Icon name="camera" size={16} /> Start a scan</a>
		</StateCard>
	{/if}
</div>

<svelte:head><title>{product ? `${product.name} - PriceLens` : `Results - PriceLens`}</title></svelte:head>

<style>
	.loading-wrap {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}
	.load-top {
		display: flex;
		align-items: flex-end;
		gap: 20px;
		padding-bottom: 24px;
		border-bottom: 1px solid var(--hair);
	}
	.pv {
		width: 96px;
		aspect-ratio: 3 / 4;
		height: auto;
		flex: none;
		object-fit: cover;
		background: var(--surface-2);
	}
	.lt {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-width: 0;
	}
	.lt h1 {
		font-size: clamp(1.8rem, 6vw, 3rem);
	}
	.msg {
		font-family: var(--serif);
		font-style: italic;
		font-size: 1.05rem;
		color: var(--ink-2);
	}
	.bar {
		height: 1px;
		margin-top: 6px;
		overflow: hidden;
		background: var(--hair);
	}
	.bar span {
		display: block;
		height: 100%;
		width: 35%;
		background: var(--ink);
		animation: slide 1.2s var(--ease) infinite alternate;
	}
	@keyframes slide {
		from {
			transform: translateX(-20%);
		}
		to {
			transform: translateX(200%);
		}
	}
	.sk-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 14px;
	}
	.unsure {
		display: flex;
		flex-direction: column;
		gap: 26px;
		max-width: 860px;
	}
	.unsure-head {
		display: flex;
		gap: 22px;
		align-items: flex-end;
		padding-bottom: 24px;
		border-bottom: 1px solid var(--hair);
	}
	.unsure-head > div {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.unsure-head .tag {
		align-self: flex-start;
	}
	.fine {
		font-size: 0.85rem;
	}
	@media (min-width: 640px) {
		.pv {
			width: 132px;
		}
	}
</style>
