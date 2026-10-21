<script lang="ts">
	// Scan / search home, styled like a fashion campaign landing page:
	// serif hero + camera/upload actions (drag-and-drop on desktop), an underline
	// search field, a "lookbook" of sample photos as portrait tiles and recent scans.
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	import StateCard from '$lib/components/StateCard.svelte';
	import { search } from '$lib/client/search.svelte.ts';
	import { store } from '$lib/client/store.svelte.ts';
	import { ui } from '$lib/client/ui.svelte.ts';
	import { svgToPngFile } from '$lib/client/image.ts';
	import { artUri } from '$lib/art.ts';
	import { SAMPLE_ART } from '$lib/samples.ts';
	import { CATEGORIES, CATEGORY_LABEL, type Category } from '$lib/types.ts';
	import { inr, timeAgo } from '$lib/format.ts';

	let cameraInput: HTMLInputElement | undefined = $state();
	let uploadInput: HTMLInputElement | undefined = $state();
	let text = $state('');
	let dragging = $state(false);
	let cameraDenied = $state(false);
	let dragDepth = 0;

	const samples = SAMPLE_ART.map((s) => ({ ...s, uri: artUri(s.art) }));
	const heroImg = artUri({ ...SAMPLE_ART[0].art, variant: 0 });
	const recent = $derived(store.data.history.slice(0, 3));

	function pick(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = ''; // allow picking the same file again
		if (file) void search.fromFile(file);
	}

	async function openCamera() {
		cameraDenied = false;
		// If the browser already knows camera access is blocked, explain instead of failing silently.
		try {
			const st = await navigator.permissions?.query({ name: 'camera' as PermissionName });
			if (st?.state === 'denied') {
				cameraDenied = true;
				return;
			}
		} catch {
			/* Permissions API without "camera" (Firefox/Safari): just open the picker */
		}
		cameraInput?.click();
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragDepth = 0;
		dragging = false;
		const file = e.dataTransfer?.files?.[0];
		if (!file) return;
		if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif|heic|heif|avif|bmp)$/i.test(file.name)) {
			search.fail('unsupported', `"${file.name}" isn't a photo. Please drop a JPG, PNG or WebP image.`);
			void goto('/results');
			return;
		}
		void search.fromFile(file);
	}
	function onDragEnter(e: DragEvent) {
		if (!e.dataTransfer?.types.includes('Files')) return;
		e.preventDefault();
		dragDepth++;
		dragging = true;
	}
	function onDragLeave() {
		dragDepth = Math.max(0, dragDepth - 1);
		if (dragDepth === 0) dragging = false;
	}

	function submitText(e: SubmitEvent) {
		e.preventDefault();
		const q = text.trim();
		if (!q) {
			ui.toast('Type what you are looking for, e.g. "white sneakers".', 'info');
			return;
		}
		void search.fromText(q);
	}

	async function trySample(key: string, uri: string, label: string, blurry = false) {
		try {
			// Neutral file name so the demo colour matcher (not the filename) does the detection.
			const n = SAMPLE_ART.findIndex((s) => s.key === key) + 1;
			const file = await svgToPngFile(uri, blurry ? 'sample-blurry.png' : `sample-photo-${n}.png`, 768, blurry ? 12 : 0);
			void search.fromFile(file);
		} catch {
			ui.toast(`Couldn't load the ${label} sample.`, 'err');
		}
	}
</script>

<svelte:window ondragenter={onDragEnter} ondragover={(e) => e.dataTransfer?.types.includes('Files') && e.preventDefault()} ondragleave={onDragLeave} ondrop={onDrop} />

<div class="page home">
	<!-- Campaign hero -->
	<section class="hero" class:dragging aria-label="Scan or upload a photo" data-testid="dropzone">
		<div class="copy">
			<span class="kicker">Visual shopping search · New season</span>
			<h1 data-testid="page-title">Snap. Compare. <em>Save.</em></h1>
			<p class="lead">Photograph a piece you love. We find the stores that sell it — <em>cheapest first</em> — with similar styles and smarter buys.</p>

			<div class="actions">
				<button type="button" class="btn big primary" onclick={openCamera} data-testid="scan-camera">
					<Icon name="camera" size={20} /> Scan with camera
				</button>
				<button type="button" class="btn big" onclick={() => uploadInput?.click()} data-testid="upload-photo">
					<Icon name="upload" size={20} /> Upload photo
				</button>
			</div>
			<p class="dz-text muted"><span class="desk">{dragging ? 'Drop your photo to scan it' : 'Or drag & drop a product photo anywhere on this page'}</span></p>
			<p class="fine muted"><Icon name="lock" size={13} /> Photos are resized on your device and never stored on our server.</p>
		</div>
		<figure class="visual" aria-hidden="true">
			<img src={heroImg} alt="" width="240" height="320" />
			<figcaption><span class="kicker">Look 01</span><span>Floral fit &amp; flare — from <b class="price">₹549</b></span></figcaption>
		</figure>
		<input bind:this={cameraInput} class="sr-only" type="file" accept="image/*" capture="environment" onchange={pick} tabindex="-1" aria-hidden="true" data-testid="camera-input" />
		<input bind:this={uploadInput} class="sr-only" type="file" accept="image/*" onchange={pick} tabindex="-1" aria-hidden="true" data-testid="file-input" />
	</section>

	{#if cameraDenied}
		<StateCard icon="camera" tone="orange" title="Camera access is blocked" message="PriceLens can't open your camera because permission was denied. Allow camera access for this site in your browser settings (tap the lock icon next to the address), or upload a photo instead." testid="camera-denied">
			<button type="button" class="btn primary" onclick={() => uploadInput?.click()}><Icon name="upload" size={16} /> Upload photo instead</button>
			<button type="button" class="btn quiet" onclick={() => ((cameraDenied = false), cameraInput?.click())}>Try camera again</button>
		</StateCard>
	{/if}

	<!-- Search -->
	<form class="textsearch" onsubmit={submitText} role="search" data-testid="text-search">
		<label for="q" class="kicker">Or type what you're looking for</label>
		<div class="ts-row">
			<Icon name="search" size={20} />
			<input id="q" class="input big-in" type="search" placeholder="Floral summer dress, white sneakers…" bind:value={text} maxlength="120" autocomplete="off" enterkeyhint="search" data-testid="text-input" />
			<button class="btn primary" type="submit" data-testid="text-submit">Search</button>
		</div>
		<div class="chips" role="group" aria-label="Shop by category">
			{#each CATEGORIES.filter((c) => c !== 'other') as c (c)}
				<button type="button" class="chip" onclick={() => search.fromText('', c as Category)} data-testid="quick-{c}">{CATEGORY_LABEL[c]}</button>
			{/each}
		</div>
	</form>

	<!-- Lookbook of sample photos -->
	<section class="stack" aria-labelledby="samples-h">
		<div class="sec-head">
			<div>
				<span class="kicker">No photo handy?</span>
				<h2 id="samples-h">The sample lookbook</h2>
			</div>
			<span class="muted fine">Tap a look to scan it · placeholder art</span>
		</div>
		<div class="samples">
			{#each samples as s, i (s.key)}
				<button type="button" class="sample" onclick={() => trySample(s.key, s.uri, s.label)} data-testid="sample-{s.key}">
					<span class="ph zoom"><img src={s.uri} alt="Sample: {s.label}" width="240" height="320" /></span>
					<span class="no kicker">Look {String(i + 1).padStart(2, '0')}</span>
					<span class="sl">{s.label}</span>
				</button>
			{/each}
			<button type="button" class="sample" onclick={() => trySample('blurry', samples[0].uri, 'blurry', true)} data-testid="sample-blurry">
				<span class="ph zoom"><img src={samples[0].uri} alt="Sample: a blurry shot of a dress" width="240" height="320" style="filter: blur(5px)" /></span>
				<span class="no kicker">Look 06</span>
				<span class="sl">Blurry shot</span>
			</button>
		</div>
	</section>

	{#if recent.length}
		<section class="stack" aria-labelledby="recent-h">
			<div class="sec-head">
				<div>
					<span class="kicker">Picked up where you left off</span>
					<h2 id="recent-h">Recent scans</h2>
				</div>
				<a class="textlink" href="/saved#history">See all</a>
			</div>
			<ul class="recent">
				{#each recent as h (h.id)}
					<li>
						<button type="button" class="rc" onclick={() => search.rerun(h)} data-testid="recent-item">
							{#if h.thumb}<img class="thumb" src={h.thumb} alt="Scan of {h.label}" width="48" height="64" />{:else}<span class="thumb ph2"><Icon name="search" size={18} /></span>{/if}
							<span class="rt"><span class="rl">{h.label}</span><small class="muted">{timeAgo(h.at)}{h.bestPrice ? ` · from ${inr(h.bestPrice)}` : ''}</small></span>
							<Icon name="chevronRight" size={18} />
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>

{#if dragging}
	<div class="drop-overlay" aria-hidden="true"><span>Drop to scan</span></div>
{/if}

<style>
	.home {
		gap: 44px;
	}
	.hero {
		display: grid;
		gap: 28px;
		padding-bottom: 36px;
		border-bottom: 1px solid var(--hair);
		transition: background-color 0.2s var(--ease);
	}
	.hero.dragging {
		background: var(--surface-2);
	}
	.copy {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}
	.hero h1 {
		font-size: clamp(3rem, 13vw, 6.4rem);
		line-height: 0.95;
		letter-spacing: -0.02em;
	}
	.hero h1 em {
		display: inline-block;
	}
	.lead {
		max-width: 44ch;
		font-size: 1.08rem;
		color: var(--ink-2);
	}
	.lead em {
		font-size: 1.12em;
	}
	.actions {
		display: grid;
		gap: 10px;
		margin-top: 6px;
	}
	.dz-text {
		font-size: 0.88rem;
	}
	.desk {
		display: none;
	}
	.fine {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.82rem;
	}
	.visual {
		display: none;
		margin: 0;
	}
	.visual img {
		width: 100%;
		height: auto;
		aspect-ratio: 3 / 4;
		object-fit: cover;
	}
	.visual figcaption {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 10px;
		padding-top: 10px;
		font-size: 0.88rem;
	}

	.textsearch {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.ts-row {
		display: flex;
		align-items: center;
		gap: 12px;
		border-bottom: 1px solid var(--ink);
	}
	.ts-row .big-in {
		flex: 1;
		min-width: 0;
		border-bottom: 0;
		font-family: var(--serif);
		font-size: clamp(1.15rem, 4vw, 1.6rem);
		min-height: 60px;
	}
	.ts-row .big-in:focus-visible {
		outline: none;
	}
	.ts-row:focus-within {
		border-bottom-width: 2px;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.samples {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 22px 14px;
	}
	.sample {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 4px;
		padding: 0;
		font: inherit;
		color: var(--ink);
		text-align: left;
		background: none;
		border: 0;
		cursor: pointer;
	}
	.sample .ph {
		display: block;
		width: 100%;
		aspect-ratio: 3 / 4;
		margin-bottom: 8px;
		background: var(--surface-2);
	}
	.sample img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.sl {
		font-family: var(--serif);
		font-size: 1.12rem;
	}
	.sample:hover .sl {
		text-decoration: underline;
		text-underline-offset: 4px;
		text-decoration-thickness: 1px;
	}

	.recent {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}
	.rc {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 12px 0;
		min-height: 64px;
		font: inherit;
		color: var(--ink);
		text-align: left;
		background: none;
		border: 0;
		border-bottom: 1px solid var(--hair);
		cursor: pointer;
	}
	.rc .thumb {
		width: 48px;
		height: 64px;
		aspect-ratio: auto;
	}
	.ph2 {
		display: grid;
		place-items: center;
	}
	.rt {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.rl {
		font-family: var(--serif);
		font-size: 1.1rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.rc:hover .rl {
		text-decoration: underline;
		text-underline-offset: 4px;
		text-decoration-thickness: 1px;
	}
	.drop-overlay {
		position: fixed;
		inset: 0;
		z-index: 80;
		display: grid;
		place-items: center;
		background: color-mix(in srgb, var(--bg) 70%, transparent);
		pointer-events: none;
	}
	.drop-overlay span {
		padding: 22px 34px;
		font: italic 400 2rem/1 var(--serif);
		color: var(--on-ink);
		background: var(--ink);
	}
	@media (min-width: 640px) {
		.samples {
			grid-template-columns: repeat(3, 1fr);
		}
		.actions {
			grid-template-columns: auto auto;
			justify-content: start;
		}
		.desk {
			display: inline;
		}
	}
	@media (min-width: 900px) {
		.hero {
			grid-template-columns: minmax(0, 1.35fr) minmax(0, 0.65fr);
			align-items: end;
			gap: 56px;
			padding: 24px 0 48px;
		}
		.visual {
			display: block;
		}
		.samples {
			grid-template-columns: repeat(6, 1fr);
		}
	}
</style>
