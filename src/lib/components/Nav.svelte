<script lang="ts">
	// Fashion-site navigation. Desktop (>= 900px): a slim announcement bar plus a
	// sticky header with a serif wordmark and uppercase tracked links (the nav
	// container is still the "sidebar" landmark/testid). Mobile/tablet: a top bar
	// with the wordmark and a minimal bottom tab bar in the thumb zone.
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
	const saved = $derived(store.data.wishlist.length);
	const hasResult = $derived(Boolean(search.result?.product));

	function active(href: string) {
		if (href === '/') return path === '/';
		if (href === '/results') return path.startsWith('/results') || path.startsWith('/product');
		return path.startsWith(href);
	}
</script>

<!-- Desktop: announcement bar + header -->
<div class="announce" aria-hidden="true">Compare Amazon · Flipkart · Myntra · Meesho · Ajio — cheapest first</div>
<aside class="sidebar" aria-label="Main navigation" data-testid="sidebar">
	<div class="hd-inner">
		<nav class="links">
			{#each TABS as t (t.id)}
				<a href={t.href} class="side-link" class:active={active(t.href)} aria-current={active(t.href) ? 'page' : undefined} data-testid="side-{t.id}">
					<span>{t.label}</span>
					{#if t.id === 'alerts' && reached > 0}<span class="count" aria-label="{reached} reached">{reached}</span>{/if}
					{#if t.id === 'saved' && saved > 0}<span class="count light" aria-label="{saved} saved">{saved}</span>{/if}
					{#if t.id === 'results' && hasResult}<span class="dot" aria-hidden="true"></span>{/if}
				</a>
			{/each}
		</nav>
		<a href="/" class="brand" aria-label="PriceLens home">
			<span class="wm">PriceLens</span>
			<span class="tl">Snap · Compare · Save</span>
		</a>
		<div class="side-foot">
			<ModeBadge />
			<button type="button" class="btn sm quiet" onclick={() => ui.toggleTheme()} aria-pressed={ui.theme === 'dark'} data-testid="theme-toggle">
				<Icon name={ui.theme === 'dark' ? 'sun' : 'moon'} size={16} />
				{ui.theme === 'dark' ? 'Light' : 'Dark'}
			</button>
		</div>
	</div>
</aside>

<!-- Mobile top bar -->
<header class="topbar" data-testid="topbar">
	<a href="/" class="brand small" aria-label="PriceLens home"><span class="wm">PriceLens</span></a>
	<div class="row tb-right">
		<ModeBadge compact />
		<button type="button" class="btn sm icon-only quiet" onclick={() => ui.toggleTheme()} aria-label={ui.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} data-testid="theme-toggle-mobile">
			<Icon name={ui.theme === 'dark' ? 'sun' : 'moon'} size={18} />
		</button>
	</div>
</header>

<!-- Mobile bottom tab bar (thumb zone) -->
<nav class="tabbar" aria-label="Main navigation" data-testid="tabbar">
	{#each TABS as t (t.id)}
		<a href={t.href} class="tab" class:active={active(t.href)} aria-current={active(t.href) ? 'page' : undefined} data-testid="tab-{t.id}">
			<span class="ti">
				<Icon name={t.icon} size={21} />
				{#if t.id === 'alerts' && reached > 0}<span class="count" aria-label="{reached} reached">{reached}</span>{/if}
				{#if t.id === 'results' && hasResult}<span class="dot" aria-hidden="true"></span>{/if}
			</span>
			<span class="tl">{t.label}</span>
		</a>
	{/each}
</nav>

<style>
	.announce,
	.sidebar {
		display: none;
	}
	.brand {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		text-decoration: none;
		color: var(--ink);
	}
	.wm {
		font-family: var(--serif);
		font-size: 1.9rem;
		font-weight: 500;
		line-height: 1;
		letter-spacing: 0.01em;
	}
	.brand .tl {
		font: 500 0.62rem/1 var(--sans);
		letter-spacing: 0.32em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.brand.small .wm {
		font-size: 1.55rem;
	}

	.topbar {
		position: sticky;
		top: 0;
		z-index: 30;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 8px 14px 8px 18px;
		padding-top: max(8px, env(safe-area-inset-top));
		background: color-mix(in srgb, var(--bg) 92%, transparent);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border-bottom: 1px solid var(--hair);
	}
	.tb-right {
		gap: 6px;
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
		padding: 4px 4px env(safe-area-inset-bottom);
		background: var(--bg);
		border-top: 1px solid var(--hair);
	}
	.tab {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		min-height: 56px;
		color: var(--muted);
		text-decoration: none;
		font: 500 0.6rem/1 var(--sans);
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.tab.active {
		color: var(--ink);
	}
	.tab.active::before {
		content: '';
		position: absolute;
		top: -5px;
		left: 32%;
		right: 32%;
		height: 2px;
		background: var(--ink);
	}
	.ti {
		position: relative;
		display: grid;
		place-items: center;
	}
	.count {
		position: absolute;
		top: -7px;
		right: -12px;
		min-width: 17px;
		height: 17px;
		padding: 0 4px;
		display: grid;
		place-items: center;
		font: 500 0.62rem/1 var(--sans);
		letter-spacing: 0;
		color: var(--on-ink);
		background: var(--ink);
		border-radius: 999px;
	}
	.count.light {
		color: var(--ink);
		background: transparent;
		border: 1px solid var(--hair);
	}
	.dot {
		position: absolute;
		top: -2px;
		right: -6px;
		width: 6px;
		height: 6px;
		background: var(--sale);
		border-radius: 50%;
	}

	@media (min-width: 900px) {
		.topbar,
		.tabbar {
			display: none;
		}
		.announce {
			display: block;
			padding: 8px 16px;
			text-align: center;
			font: 500 0.66rem/1.2 var(--sans);
			letter-spacing: 0.24em;
			text-transform: uppercase;
			color: var(--on-ink);
			background: var(--ink);
		}
		.sidebar {
			display: block;
			position: sticky;
			top: 0;
			z-index: 30;
			background: color-mix(in srgb, var(--bg) 94%, transparent);
			backdrop-filter: blur(10px);
			-webkit-backdrop-filter: blur(10px);
			border-bottom: 1px solid var(--hair);
		}
		.hd-inner {
			display: grid;
			grid-template-columns: 1fr auto 1fr;
			align-items: center;
			gap: 24px;
			max-width: 1340px;
			margin: 0 auto;
			padding: 14px 48px;
		}
		.links {
			display: flex;
			gap: 26px;
		}
		.side-link {
			position: relative;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 6px;
			min-height: 44px;
			min-width: 44px;
			font: 500 0.72rem/1 var(--sans);
			letter-spacing: 0.18em;
			text-transform: uppercase;
			color: var(--ink);
			text-decoration: none;
		}
		.side-link::after {
			content: '';
			position: absolute;
			left: 0;
			right: 0;
			bottom: 9px;
			height: 1px;
			background: var(--ink);
			transform: scaleX(0);
			transform-origin: left;
			transition: transform 0.25s var(--ease);
		}
		.side-link:hover::after,
		.side-link.active::after {
			transform: scaleX(1);
		}
		.side-link .count {
			position: static;
		}
		.side-link .dot {
			position: static;
		}
		.side-foot {
			display: flex;
			align-items: center;
			justify-content: flex-end;
			gap: 14px;
		}
	}
	@media (min-width: 900px) and (max-width: 1100px) {
		.links {
			gap: 16px;
		}
		.hd-inner {
			padding: 12px 28px;
		}
	}
</style>
