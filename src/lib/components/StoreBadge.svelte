<script lang="ts">
	// Logo-style store badge: coloured initials tile (no trademarked logos).
	import { storeMeta } from '$lib/stores.ts';
	let { store, name = '', size = 40 }: { store: string; name?: string; size?: number } = $props();
	const meta = $derived(storeMeta(store, name || store));
</script>

<span class="sb mono" style="--bg:{meta.bg};--fg:{meta.fg};--s:{size}px" aria-hidden="true" title={meta.name}>{meta.initials}</span>

<style>
	.sb {
		display: inline-grid;
		place-items: center;
		flex: none;
		width: var(--s);
		height: var(--s);
		font-weight: 700;
		font-size: calc(var(--s) * 0.38);
		color: var(--fg);
		background: var(--bg);
		border: var(--bw) solid var(--line);
		border-radius: 12px;
		box-shadow: 2px 2px 0 var(--line);
		letter-spacing: -0.04em;
	}
</style>
