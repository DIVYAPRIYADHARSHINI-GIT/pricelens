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
			<div class="card load-top">
				{#if search.preview}
					<img class="thumb pv" src={search.preview} alt="Your scanned product" width="112" height="112" data-testid="preview" />
				{:else}
					<div class="skeleton pv" aria-hidden="true"></div>
				{/if}
				<div class="lt">
					<h1 data-testid="page-title">{phase === 'processing' ? 'Getting your photo ready…' : 'Comparing prices…'}</h1>
					<p class="msg" data-testid="loading-message">{search.message}</p>
					<div class="bar" aria-hidden="true"><span></span></div>
				</div>
			</div>
			<div class="skeleton" style="height: 220px" aria-hidden="true"></div>
			<div class="skeleton" style="height: 96px" aria-hidden="true"></div>
			<div class="skeleton" style="height: 96px" aria-hidden="true"></div>
			<div class="sk-row" aria-hidden="true">
				{#each [1, 2, 3] as i (i)}<div class="skeleton" style="height: 200px"></div>{/each}
			</div>
		</section>
	{:else if phase === 'error' && search.error}
		{@const e = ERR[search.error.kind] ?? ERR.server}
		<h1 class="sr-only" data-testid="page-title">{e.title}</h1>
		<StateCard icon={e.icon} tone={e.tone} title={e.title} message={search.error.message} testid="error-{search.error.kind}">
			{#if search.error.kind === 'offline' || search.error.kind === 'server' || search.error.kind === 'rate-limited'}
				<button type="button" class="btn yellow" onclick={() => search.retry()} data-testid="retry"><Icon name="refresh" size={18} /> Try again</button>
			{/if}
			<a class="btn" href="/" onclick={() => search.reset()} data-testid="back-scan"><Icon name="camera" size={18} /> Scan another photo</a>
		</StateCard>
	{:else if phase === 'uncertain' && result}
		<section class="card unsure" data-testid="not-sure">
			<div class="unsure-head">
				{#if search.preview}
					<img class="thumb pv" src={search.preview} alt="What you scanned" width="112" height="112" />
				{/if}
				<div>
					{#if detected?.reason === 'blurry'}
						<p class="tag above"><Icon name="blur" size={16} /> Blurry photo</p>
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
				<a class="btn sm" href="/" onclick={() => search.reset()} data-testid="retake"><Icon name="camera" size={18} /> Retake photo</a>
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
			<a class="btn yellow" href="/" data-testid="go-scan"><Icon name="camera" size={18} /> Start a scan</a>
		</StateCard>
	{/if}
</div>

<svelte:head><title>{product ? `${product.name} - PriceLens` : `Results - PriceLens`}</title></svelte:head>

<style>
	.loading-wrap {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.load-top {
		display: flex;
		align-items: center;
		gap: 16px;
	}
	.pv {
		width: 96px;
		height: 96px;
		flex: none;
		object-fit: cover;
	}
	.lt {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 0;
	}
	.lt h1 {
		font-size: clamp(1.3rem, 5vw, 1.8rem);
	}
	.msg {
		font-weight: 700;
	}
	.bar {
		height: 14px;
		border: var(--bw) solid var(--line);
		border-radius: 999px;
		overflow: hidden;
		background: var(--surface-2);
	}
	.bar span {
		display: block;
		height: 100%;
		width: 40%;
		background: var(--yellow);
		border-right: var(--bw) solid var(--line);
		animation: slide 1.1s ease-in-out infinite alternate;
	}
	@keyframes slide {
		from {
			transform: translateX(-10%);
		}
		to {
			transform: translateX(160%);
		}
	}
	.sk-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
	}
	.unsure {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.unsure-head {
		display: flex;
		gap: 16px;
		align-items: flex-start;
	}
	.unsure-head > div {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.unsure-head .tag {
		align-self: flex-start;
	}
	.fine {
		font-size: 0.85rem;
	}
	@media (min-width: 640px) {
		.pv {
			width: 112px;
			height: 112px;
		}
	}
</style>
