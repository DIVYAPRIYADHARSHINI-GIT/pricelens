<script lang="ts">
	// Scan / search home: camera + upload + drag-and-drop, text search, sample photos.
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
	<section class="hero">
		<p class="kicker tag demo-k">Visual shopping search</p>
		<h1 data-testid="page-title">Snap. Compare. <span class="hl">Save.</span></h1>
		<p class="lead">Take a photo of something you like - PriceLens shows which stores sell it, <b>cheapest first</b>, plus similar and cheaper picks.</p>
	</section>

	<!-- Drop zone + main actions (bottom half / thumb zone on mobile) -->
	<section class="scan card" class:dragging aria-label="Scan or upload a photo" data-testid="dropzone">
		<div class="dz-art" aria-hidden="true">
			<svg viewBox="0 0 120 90" width="120" height="90"><rect x="6" y="14" width="108" height="70" rx="14" fill="var(--yellow)" stroke="currentColor" stroke-width="5" /><rect x="40" y="4" width="40" height="16" rx="6" fill="var(--pink)" stroke="currentColor" stroke-width="5" /><circle cx="60" cy="49" r="20" fill="var(--blue)" stroke="currentColor" stroke-width="5" /><circle cx="60" cy="49" r="8" fill="var(--surface)" stroke="currentColor" stroke-width="4" /></svg>
		</div>
		<p class="dz-text"><b>{dragging ? 'Drop your photo here!' : 'Drag & drop a product photo'}</b><span class="muted desk">{' '}or use the buttons below</span></p>

		<div class="actions">
			<button type="button" class="btn big yellow block wobble" onclick={openCamera} data-testid="scan-camera">
				<Icon name="camera" size={28} stroke={2.6} /> Scan with camera
			</button>
			<button type="button" class="btn big pink block wobble" onclick={() => uploadInput?.click()} data-testid="upload-photo">
				<Icon name="upload" size={26} stroke={2.6} /> Upload photo
			</button>
		</div>
		<input bind:this={cameraInput} class="sr-only" type="file" accept="image/*" capture="environment" onchange={pick} tabindex="-1" aria-hidden="true" data-testid="camera-input" />
		<input bind:this={uploadInput} class="sr-only" type="file" accept="image/*" onchange={pick} tabindex="-1" aria-hidden="true" data-testid="file-input" />
		<p class="muted fine"><Icon name="lock" size={14} /> Photos are resized on your phone and never stored on our server.</p>
	</section>

	{#if cameraDenied}
		<StateCard icon="camera" tone="orange" title="Camera access is blocked" message="PriceLens can't open your camera because permission was denied. Allow camera access for this site in your browser settings (tap the lock icon next to the address), or upload a photo instead." testid="camera-denied">
			<button type="button" class="btn pink" onclick={() => uploadInput?.click()}><Icon name="upload" size={18} /> Upload photo instead</button>
			<button type="button" class="btn" onclick={() => ((cameraDenied = false), cameraInput?.click())}>Try camera again</button>
		</StateCard>
	{/if}

	<form class="card textsearch" onsubmit={submitText} role="search" data-testid="text-search">
		<label for="q" class="tlabel">or type what you're looking for</label>
		<div class="ts-row">
			<input id="q" class="input" type="search" placeholder="e.g. floral summer dress" bind:value={text} maxlength="120" autocomplete="off" enterkeyhint="search" data-testid="text-input" />
			<button class="btn blue" type="submit" data-testid="text-submit"><Icon name="search" size={20} /> Search</button>
		</div>
		<div class="chips" role="group" aria-label="Quick categories">
			{#each CATEGORIES.filter((c) => c !== 'other') as c (c)}
				<button type="button" class="chip" onclick={() => search.fromText('', c as Category)} data-testid="quick-{c}">{CATEGORY_LABEL[c]}</button>
			{/each}
		</div>
	</form>

	<section class="stack" aria-labelledby="samples-h">
		<div class="spread">
			<h2 id="samples-h">No photo handy? Try a sample</h2>
			<span class="tag">Placeholder art</span>
		</div>
		<div class="samples">
			{#each samples as s (s.key)}
				<button type="button" class="sample card wobble" onclick={() => trySample(s.key, s.uri, s.label)} data-testid="sample-{s.key}">
					<img src={s.uri} alt="Sample: {s.label}" width="96" height="96" />
					<span>{s.label}</span>
				</button>
			{/each}
			<button type="button" class="sample card wobble" onclick={() => trySample('blurry', samples[0].uri, 'blurry', true)} data-testid="sample-blurry">
				<img src={samples[0].uri} alt="Sample: a blurry shot of a dress" width="96" height="96" style="filter: blur(4px)" />
				<span>Blurry shot</span>
			</button>
		</div>
	</section>

	{#if recent.length}
		<section class="stack" aria-labelledby="recent-h">
			<div class="spread">
				<h2 id="recent-h">Recent scans</h2>
				<a class="btn sm" href="/saved#history">See all</a>
			</div>
			<ul class="recent">
				{#each recent as h (h.id)}
					<li>
						<button type="button" class="rc card flat" onclick={() => search.rerun(h)} data-testid="recent-item">
							{#if h.thumb}<img class="thumb" src={h.thumb} alt="Scan of {h.label}" width="48" height="48" />{:else}<span class="thumb ph"><Icon name="search" size={20} /></span>{/if}
							<span class="rt"><b>{h.label}</b><small class="muted">{timeAgo(h.at)}{h.bestPrice ? ` · from ${inr(h.bestPrice)}` : ''}</small></span>
							<Icon name="refresh" size={18} />
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
		gap: 22px;
	}
	.hero {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.demo-k {
		align-self: flex-start;
		background: var(--blue);
		color: #111;
		rotate: -2deg;
	}
	.hl {
		background: var(--yellow);
		color: #111;
		padding: 0 8px;
		border: var(--bw) solid var(--line);
		border-radius: 12px;
		box-shadow: var(--shadow-sm);
		display: inline-block;
		rotate: -2deg;
	}
	.lead {
		font-size: 1.05rem;
		color: var(--ink-2);
		max-width: 52ch;
	}
	.scan {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
		padding: 22px 16px;
		border-style: dashed;
		transition: background 0.12s;
	}
	.scan.dragging {
		background: var(--surface-2);
		border-style: solid;
	}
	.dz-art {
		color: var(--line);
	}
	.dz-text {
		text-align: center;
	}
	.desk {
		display: none;
	}
	.actions {
		display: grid;
		gap: 14px;
		width: 100%;
		max-width: 520px;
	}
	.fine {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.85rem;
		text-align: center;
	}
	.textsearch {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.tlabel {
		font-weight: 700;
		font-size: 1.05rem;
	}
	.ts-row {
		display: flex;
		gap: 10px;
	}
	.ts-row .input {
		flex: 1;
		min-width: 0;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.samples {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
	}
	.sample {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 8px;
		font: 700 0.85rem var(--font);
		color: var(--ink);
		cursor: pointer;
		box-shadow: var(--shadow-sm);
		text-align: center;
	}
	.sample img {
		width: 100%;
		height: auto;
		border: 2px solid var(--line);
		border-radius: 10px;
		overflow: hidden;
	}
	.sample:active {
		transform: translate(3px, 3px);
		box-shadow: none;
	}
	.recent {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.rc {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 12px;
		min-height: 64px;
		font: inherit;
		color: var(--ink);
		text-align: left;
		cursor: pointer;
	}
	.rc .thumb {
		width: 48px;
		height: 48px;
	}
	.ph {
		display: grid;
		place-items: center;
	}
	.rt {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.rt b {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.drop-overlay {
		position: fixed;
		inset: 0;
		z-index: 80;
		display: grid;
		place-items: center;
		background: rgba(255, 214, 10, 0.35);
		pointer-events: none;
	}
	.drop-overlay span {
		padding: 18px 28px;
		font-size: 1.6rem;
		font-weight: 700;
		color: #111;
		background: var(--yellow);
		border: var(--bw) solid #111;
		border-radius: 20px;
		box-shadow: var(--shadow-lg);
	}
	@media (min-width: 640px) {
		.samples {
			grid-template-columns: repeat(6, 1fr);
		}
		.actions {
			grid-template-columns: 1fr 1fr;
		}
		.desk {
			display: inline;
		}
	}
	@media (min-width: 900px) {
		.scan {
			padding: 34px;
		}
	}
</style>
