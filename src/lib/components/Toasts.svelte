<script lang="ts">
	import { ui } from '$lib/client/ui.svelte.ts';
	import Icon from './Icon.svelte';
</script>

<div class="toasts" aria-live="polite" aria-atomic="false">
	{#each ui.toasts as t (t.id)}
		<div class="toast {t.tone}" role={t.tone === 'err' ? 'alert' : 'status'} data-testid="toast">
			<Icon name={t.tone === 'err' ? 'close' : t.tone === 'info' ? 'sparkle' : 'check'} size={16} />
			<span>{t.text}</span>
			<button type="button" class="x" aria-label="Dismiss" onclick={() => ui.dismiss(t.id)}><Icon name="close" size={14} /></button>
		</div>
	{/each}
</div>

<style>
	.toasts {
		position: fixed;
		left: 50%;
		translate: -50% 0;
		bottom: calc(var(--tabbar-h) + 14px + env(safe-area-inset-bottom));
		z-index: 90;
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: min(420px, calc(100vw - 24px));
		pointer-events: none;
	}
	.toast {
		pointer-events: auto;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 4px 4px 4px 16px;
		font-size: 0.9rem;
		color: var(--on-ink);
		background: var(--ink);
		animation: rise 0.28s var(--ease);
	}
	.toast.err {
		background: var(--sale);
	}
	.toast span {
		flex: 1;
		padding: 10px 0;
		overflow-wrap: anywhere;
	}
	.x {
		flex: none;
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		color: inherit;
		background: transparent;
		border: 0;
		cursor: pointer;
		opacity: 0.8;
	}
	.x:hover {
		opacity: 1;
	}
	@keyframes rise {
		from {
			transform: translateY(10px);
			opacity: 0;
		}
	}
	@media (min-width: 900px) {
		.toasts {
			left: auto;
			right: 24px;
			translate: none;
			bottom: 24px;
		}
	}
</style>
