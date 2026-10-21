<script lang="ts">
	// Store monogram badge (no trademarked logos): store colour as a thin underline accent,
	// initials set in the display serif inside a hairline square.
	import { storeMeta } from '$lib/stores.ts';
	let { store, name = '', size = 40 }: { store: string; name?: string; size?: number } = $props();
	const meta = $derived(storeMeta(store, name || store));
</script>

<span class="sb" style="--accent:{meta.bg};--s:{size}px" aria-hidden="true" title={meta.name}>{meta.initials}</span>

<style>
	.sb {
		position: relative;
		display: inline-grid;
		place-items: center;
		flex: none;
		width: var(--s);
		height: var(--s);
		font-family: var(--serif);
		font-size: calc(var(--s) * 0.42);
		font-weight: 500;
		color: var(--ink);
		background: var(--surface);
		border: 1px solid var(--hair);
		text-transform: none;
	}
	.sb::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: -1px;
		height: 3px;
		background: var(--accent);
	}
</style>
