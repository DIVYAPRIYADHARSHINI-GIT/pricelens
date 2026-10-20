<script lang="ts">
	import { tick } from 'svelte';
	import { ui } from '$lib/client/ui.svelte.ts';

	let dialog: HTMLDialogElement | undefined = $state();
	let cancelBtn: HTMLButtonElement | undefined = $state();

	// Open/close the native <dialog> when the confirm state changes (DOM only, no state writes).
	$effect(() => {
		const open = Boolean(ui.confirm);
		if (!dialog) return;
		if (open && !dialog.open) {
			dialog.showModal();
			void tick().then(() => cancelBtn?.focus());
		} else if (!open && dialog.open) dialog.close();
	});
</script>

<dialog bind:this={dialog} class="dlg" aria-labelledby="dlg-title" oncancel={(e) => (e.preventDefault(), ui.answer(false))} data-testid="confirm-dialog">
	{#if ui.confirm}
		<h2 id="dlg-title">{ui.confirm.title}</h2>
		<p>{ui.confirm.message}</p>
		<div class="row end">
			<button type="button" class="btn" bind:this={cancelBtn} onclick={() => ui.answer(false)} data-testid="confirm-cancel">Cancel</button>
			<button type="button" class="btn {ui.confirm.danger ? 'pink' : 'green'}" onclick={() => ui.answer(true)} data-testid="confirm-ok">{ui.confirm.confirmLabel}</button>
		</div>
	{/if}
</dialog>

<style>
	.dlg {
		width: min(440px, calc(100vw - 32px));
		padding: 22px;
		color: var(--ink);
		background: var(--surface);
		border: var(--bw) solid var(--line);
		border-radius: 20px;
		box-shadow: var(--shadow-lg);
	}
	.dlg::backdrop {
		background: rgba(0, 0, 0, 0.5);
	}
	h2 {
		margin-bottom: 8px;
	}
	p {
		margin-bottom: 18px;
		color: var(--ink-2);
	}
	.end {
		justify-content: flex-end;
	}
</style>
