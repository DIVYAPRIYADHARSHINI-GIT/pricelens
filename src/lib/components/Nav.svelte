<script lang="ts">
	// Sidebar on desktop (>= 900px), top bar + bottom tab bar on mobile/tablet.
	import { page } from '$app/state';
	import Icon, { type IconName } from './Icon.svelte';
	import ModeBadge from './ModeBadge.svelte';
	import { ui } from '$lib/client/ui.svelte.ts';
	import { store } from '$lib/client/store.svelte.ts';
	import { search } from '$lib/client/search.svelte.ts';

	const TABS: { href: string; label: string; icon: IconName; id: string }[] = [
		{ href: '/', label: 'Scan', icon: 'camera', id: 'scan' },
		{ href: '/results', label: 'Results', icon: 'list', id: 'results' },
		{ href: '/saved', label: 'Saved', icon: 'heart', id: 'saved' },
		{ href: '/alerts', label: 'Alerts', icon: 'bell', id: 'alerts' },
		{ href: '/settings', label: 'Settings', icon: 'settings', id: 'settings' }
	];

	const path = $derived(page.url.pathname);
	const reached = $derived(store.data.alerts.filter((a) => a.reached).length);
	const hasResult = $derived(Boolean(search.result?.product));

	function active(href: string) {
		if (href === '/') return path === '/';
		if (href === '/results') return path.startsWith('/results') || path.startsWith('/product');
		return path.startsWith(href);
	}
</script>

<!-- Desktop sidebar -->
<aside class="sidebar" aria-label="Main navigation" data-testid="sidebar">
	<a href="/" class="brand wobble">
		<span class="logo" aria-hidden="true"><Icon name="search" size={26} stroke={3.2} /></span>
		<span class="bt"><b>PriceLens</b><small>Snap. Compare. Save.</small></span>
	</a>
	<nav>
		{#each TABS as t (t.id)}
			<a href={t.href} class="side-link" class:active={active(t.href)} aria-current={active(t.href) ? 'page' : undefined} data-testid="side-{t.id}">
				<Icon name={t.icon} />
				<span>{t.label}</span>
				{#if t.id === 'alerts' && reached > 0}<span class="count mono" aria-label="{reached} reached">{reached}</span>{/if}
				{#if t.id === 'results' && hasResult}<span class="dot" aria-hidden="true"></span>{/if}
			</a>
		{/each}
	</nav>
	<div class="side-foot">
		<ModeBadge />
		<button type="button" class="btn sm" onclick={() => ui.toggleTheme()} aria-pressed={ui.theme === 'dark'} data-testid="theme-toggle">
			<Icon name={ui.theme === 'dark' ? 'sun' : 'moon'} size={18} />
			{ui.theme === 'dark' ? 'Light mode' : 'Dark mode'}
		</button>
	</div>
</aside>

<!-- Mobile top bar -->
<header class="topbar" data-testid="topbar">
	<a href="/" class="brand small">
		<span class="logo" aria-hidden="true"><Icon name="search" size={20} stroke={3.2} /></span>
		<b>PriceLens</b>
	</a>
	<div class="row tb-right">
		<ModeBadge compact />
		<button type="button" class="btn sm icon-only" onclick={() => ui.toggleTheme()} aria-label={ui.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} data-testid="theme-toggle-mobile">
			<Icon name={ui.theme === 'dark' ? 'sun' : 'moon'} size={20} />
		</button>
	</div>
</header>

<!-- Mobile bottom tab bar (thumb zone) -->
<nav class="tabbar" aria-label="Main navigation" data-testid="tabbar">
	{#each TABS as t (t.id)}
		<a href={t.href} class="tab" class:active={active(t.href)} aria-current={active(t.href) ? 'page' : undefined} data-testid="tab-{t.id}">
			<span class="ti">
				<Icon name={t.icon} size={22} />
				{#if t.id === 'alerts' && reached > 0}<span class="count mono" aria-label="{reached} reached">{reached}</span>{/if}
				{#if t.id === 'results' && hasResult}<span class="dot" aria-hidden="true"></span>{/if}
			</span>
			<span class="tl">{t.label}</span>
		</a>
	{/each}
</nav>

<style>
	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
		text-decoration: none;
		color: var(--ink);
	}
	.logo {
		display: grid;
		place-items: center;
		width: 46px;
		height: 46px;
		background: var(--yellow);
		color: #111;
		border: var(--bw) solid var(--line);
		border-radius: 14px;
		box-shadow: var(--shadow-sm);
	}
	.brand.small .logo {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		box-shadow: 2px 2px 0 var(--line);
	}
	.bt {
		display: flex;
		flex-direction: column;
	}
	.bt b {
		font-size: 1.45rem;
		letter-spacing: -0.03em;
	}
	.bt small {
		font-weight: 700;
		font-size: 0.8rem;
		color: var(--muted);
	}
	.brand.small b {
		font-size: 1.2rem;
		letter-spacing: -0.03em;
	}

	.sidebar {
		display: none;
	}
	.topbar {
		position: sticky;
		top: 0;
		z-index: 30;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 8px 12px;
		padding-top: max(8px, env(safe-area-inset-top));
		background: var(--bg);
		border-bottom: var(--bw) solid var(--line);
	}
	.tb-right {
		gap: 8px;
		flex-wrap: nowrap;
	}

	.tabbar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 40;
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		height: calc(var(--tabbar-h) + env(safe-area-inset-bottom));
		padding: 6px 4px env(safe-area-inset-bottom);
		background: var(--surface);
		border-top: var(--bw) solid var(--line);
	}
	.tab {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		min-height: 56px;
		color: var(--ink);
		text-decoration: none;
		font-weight: 700;
		font-size: 0.75rem;
		border-radius: 14px;
	}
	.ti {
		position: relative;
		display: grid;
		place-items: center;
		width: 48px;
		height: 32px;
		border-radius: 999px;
		border: 2px solid transparent;
	}
	.tab.active .ti {
		background: var(--yellow);
		color: #111;
		border-color: var(--line);
		box-shadow: 2px 2px 0 var(--line);
	}
	.count {
		position: absolute;
		top: -6px;
		right: -2px;
		min-width: 20px;
		height: 20px;
		padding: 0 5px;
		display: grid;
		place-items: center;
		font-size: 0.7rem;
		color: #111;
		background: var(--green);
		border: 2px solid var(--line);
		border-radius: 999px;
	}
	.dot {
		position: absolute;
		top: 0;
		right: 6px;
		width: 10px;
		height: 10px;
		background: var(--pink);
		border: 2px solid var(--line);
		border-radius: 50%;
	}

	@media (min-width: 900px) {
		.topbar,
		.tabbar {
			display: none;
		}
		.sidebar {
			position: sticky;
			top: 0;
			height: 100vh;
			display: flex;
			flex-direction: column;
			gap: 26px;
			width: 250px;
			flex: none;
			padding: 24px 18px;
			background: var(--surface);
			border-right: var(--bw) solid var(--line);
		}
		nav {
			display: flex;
			flex-direction: column;
			gap: 8px;
		}
		.side-link {
			position: relative;
			display: flex;
			align-items: center;
			gap: 12px;
			min-height: 50px;
			padding: 10px 14px;
			font-weight: 700;
			font-size: 1.05rem;
			color: var(--ink);
			text-decoration: none;
			border: var(--bw) solid transparent;
			border-radius: 14px;
			transition: transform 0.08s;
		}
		.side-link:hover {
			border-color: var(--line);
			transform: translate(-1px, -1px);
		}
		.side-link.active {
			background: var(--yellow);
			color: #111;
			border-color: var(--line);
			box-shadow: var(--shadow-sm);
		}
		.side-link .count {
			position: static;
			margin-left: auto;
		}
		.side-link .dot {
			position: static;
			margin-left: auto;
		}
		.side-foot {
			margin-top: auto;
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			gap: 12px;
		}
	}
</style>
