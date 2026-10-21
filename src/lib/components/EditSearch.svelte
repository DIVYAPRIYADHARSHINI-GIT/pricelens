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
					{#if cat === c}<Icon name="check" size={14} />{/if}{CATEGORY_LABEL[c]}
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
		<button type="submit" class="btn primary" data-testid="edit-submit"><Icon name="search" size={16} /> {submitLabel}</button>
		{#if oncancel}<button type="button" class="btn quiet" onclick={oncancel}>Cancel</button>{/if}
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
		margin-bottom: 10px;
		font: 500 0.7rem/1.2 var(--sans);
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
</style>
