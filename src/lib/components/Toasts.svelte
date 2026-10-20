<script lang="ts">
	import { ui } from '$lib/client/ui.svelte.ts';
	import Icon from './Icon.svelte';
</script>

<div class="toasts" aria-live="polite" aria-atomic="false">
	{#each ui.toasts as t (t.id)}
		<div class="toast {t.tone}" role={t.tone === 'err' ? 'alert' : 'status'} data-testid="toast">
			<Icon name={t.tone === 'err' ? 'close' : t.tone === 'info' ? 'sparkle' : 'check'} size={18} stroke={3} />
			<span>{t.text}</span>
			<button type="button" class="x" aria-label="Dismiss" onclick={() => ui.dismiss(t.id)}><Icon name="close" size={14} stroke={3} /></button>
		</div>
	{/each}
</div>

<style>
	.toasts {
		position: fixed;
		left: 50%;
		translate: -50% 0;
		bottom: calc(var(--tabbar-h) + 16px + env(safe-area-inset-bottom));
		z-index: 90;
		display: flex;
		flex-direction: column;
		gap: 10px;
		width: min(400px, calc(100vw - 24px));
		pointer-events: none;
	}
	.toast {
		pointer-events: auto;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 10px 10px 14px;
		font-weight: 700;
		font-size: 0.95rem;
		color: #111;
		background: var(--green);
		border: var(--bw) solid var(--line);
		border-radius: 14px;
		box-shadow: var(--shadow-sm);
		animation: pop 0.18s ease-out;
	}
	.toast.err {
		background: var(--red);
	}
	.toast.info {
		background: var(--blue);
	}
	.toast span {
		flex: 1;
		overflow-wrap: anywhere;
	}
	.x {
		display: grid;
		place-items: center;
		flex: none;
		width: 44px;
		height: 44px;
		color: #111;
		background: transparent;
		border: 2px solid #111;
		border-radius: 50%;
		cursor: pointer;
	}
	@keyframes pop {
		from {
			transform: translateY(8px);
			opacity: 0;
		}
	}
	@media (min-width: 900px) {
		.toasts {
			left: auto;
			right: 20px;
			translate: none;
			bottom: 20px;
		}
	}
</style>
