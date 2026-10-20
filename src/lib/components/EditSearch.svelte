<script lang="ts">
	// Category chips + text box used by the "Not sure what this is?" screen and the edit button.
	import { CATEGORIES, CATEGORY_LABEL, type Category } from '$lib/types.ts';
	import Icon from './Icon.svelte';

	let {
		initialQuery = '',
		initialCategory = null,
		submitLabel = 'Search again',
		onsubmit,
		oncancel
	}: { initialQuery?: string; initialCategory?: Category | null; submitLabel?: string; onsubmit: (q: string, c: Category | null) => void; oncancel?: () => void } = $props();

	// Initial values are copied once (the parent re-creates this component when needed).
	// svelte-ignore state_referenced_locally
	let q = $state(initialQuery);
	// svelte-ignore state_referenced_locally
	let cat = $state<Category | null>(initialCategory);
	let err = $state('');

	function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!q.trim() && !cat) {
			err = 'Pick a category or type a few words.';
			return;
		}
		err = '';
		onsubmit(q.trim(), cat);
	}
</script>

<form class="edit" onsubmit={submit} data-testid="edit-search">
	<fieldset>
		<legend>What is it?</legend>
		<div class="chips">
			{#each CATEGORIES as c (c)}
				<button type="button" class="chip" aria-pressed={cat === c} onclick={() => ((cat = cat === c ? null : c), (err = ''))} data-testid="cat-{c}">
					{#if cat === c}<Icon name="check" size={16} stroke={3} />{/if}{CATEGORY_LABEL[c]}
				</button>
			{/each}
		</div>
	</fieldset>
	<label class="field">
		<span>Describe it (optional)</span>
		<input class="input" type="text" bind:value={q} maxlength="120" placeholder="e.g. white canvas sneakers" autocomplete="off" data-testid="edit-query" />
	</label>
	{#if err}<p class="err" role="alert">{err}</p>{/if}
	<div class="row">
		<button type="submit" class="btn yellow" data-testid="edit-submit"><Icon name="search" size={18} /> {submitLabel}</button>
		{#if oncancel}<button type="button" class="btn" onclick={oncancel}>Cancel</button>{/if}
	</div>
</form>

<style>
	.edit {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	fieldset {
		border: none;
		margin: 0;
		padding: 0;
	}
	legend {
		font-weight: 700;
		margin-bottom: 8px;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.err {
		font-weight: 700;
		color: var(--ink);
		background: var(--red);
		color: #111;
		padding: 6px 10px;
		border: 2px solid var(--line);
		border-radius: 10px;
		align-self: flex-start;
	}
</style>
