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
			<button type="button" class="btn quiet" bind:this={cancelBtn} onclick={() => ui.answer(false)} data-testid="confirm-cancel">Cancel</button>
			<button type="button" class="btn {ui.confirm.danger ? 'danger' : 'primary'}" onclick={() => ui.answer(true)} data-testid="confirm-ok">{ui.confirm.confirmLabel}</button>
		</div>
	{/if}
</dialog>

<style>
	.dlg {
		width: min(460px, calc(100vw - 32px));
		padding: 32px 28px 24px;
		color: var(--ink);
		background: var(--bg);
		border: 1px solid var(--line);
		border-radius: 0;
	}
	.dlg::backdrop {
		background: rgba(10, 10, 10, 0.45);
	}
	h2 {
		margin-bottom: 12px;
		font-size: 1.8rem;
	}
	p {
		margin-bottom: 24px;
		color: var(--ink-2);
	}
	.end {
		justify-content: flex-end;
	}
</style>
