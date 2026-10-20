<script lang="ts">
	// Simple SVG line chart for price history (no chart library).
	import type { PricePoint } from '$lib/types.ts';
	import { inr, shortDate } from '$lib/format.ts';

	let { points, target = 0 }: { points: PricePoint[]; target?: number } = $props();

	const W = 600;
	const H = 220;
	const P = { l: 64, r: 16, t: 16, b: 34 };

	const geo = $derived.by(() => {
		const prices = points.map((p) => p.price);
		const all = target > 0 ? [...prices, target] : prices;
		let lo = Math.min(...all);
		let hi = Math.max(...all);
		if (hi - lo < 50) {
			hi += 50;
			lo -= 50;
		}
		const pad = (hi - lo) * 0.12;
		lo = Math.max(0, lo - pad);
		hi = hi + pad;
		const x = (i: number) => P.l + (i * (W - P.l - P.r)) / Math.max(1, points.length - 1);
		const y = (v: number) => P.t + ((hi - v) * (H - P.t - P.b)) / (hi - lo);
		const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.price).toFixed(1)}`).join(' ');
		const area = `${line} L${x(points.length - 1).toFixed(1)} ${H - P.b} L${x(0).toFixed(1)} ${H - P.b} Z`;
		const ticks = [0, 1, 2, 3].map((k) => lo + ((hi - lo) * k) / 3);
		const minI = prices.indexOf(Math.min(...prices));
		const step = Math.max(1, Math.ceil(points.length / 5));
		return { x, y, line, area, ticks, minI, step };
	});
	const low = $derived(Math.min(...points.map((p) => p.price)));
	const high = $derived(Math.max(...points.map((p) => p.price)));
	const now = $derived(points.at(-1)?.price ?? 0);
</script>

{#if points.length > 1}
	<figure class="chart" data-testid="price-chart">
		<svg viewBox="0 0 {W} {H}" role="img" aria-labelledby="pc-title pc-desc">
			<title id="pc-title">Price history</title>
			<desc id="pc-desc">Over the last {points.length} weeks the lowest price ranged from {inr(low)} to {inr(high)}. Today: {inr(now)}.</desc>
			{#each geo.ticks as t (t)}
				<line x1={P.l} x2={W - P.r} y1={geo.y(t)} y2={geo.y(t)} class="grid" />
				<text x={P.l - 8} y={geo.y(t) + 4} text-anchor="end" class="lbl">{inr(t)}</text>
			{/each}
			{#each points as p, i (p.date)}
				{#if i % geo.step === 0 || i === points.length - 1}
					<text x={geo.x(i)} y={H - 10} text-anchor="middle" class="lbl">{i === points.length - 1 ? 'Today' : shortDate(p.date)}</text>
				{/if}
			{/each}
			{#if target > 0}
				<line x1={P.l} x2={W - P.r} y1={geo.y(target)} y2={geo.y(target)} class="target" />
				<text x={W - P.r} y={geo.y(target) - 6} text-anchor="end" class="lbl tl">Alert {inr(target)}</text>
			{/if}
			<path d={geo.area} class="area" />
			<path d={geo.line} class="line" />
			{#each points as p, i (p.date)}
				<circle cx={geo.x(i)} cy={geo.y(p.price)} r={i === points.length - 1 || i === geo.minI ? 6 : 3.5} class:now={i === points.length - 1} class:min={i === geo.minI} class="pt"><title>{shortDate(p.date)}: {inr(p.price)}</title></circle>
			{/each}
		</svg>
		<figcaption class="row cap">
			<span>Low <b class="mono">{inr(low)}</b></span>
			<span>High <b class="mono">{inr(high)}</b></span>
			<span>Today <b class="mono">{inr(now)}</b></span>
		</figcaption>
	</figure>
{:else}
	<p class="muted">Price history builds up as prices are checked over time.</p>
{/if}

<style>
	.chart {
		margin: 0;
	}
	svg {
		width: 100%;
		height: auto;
		display: block;
		background: var(--surface);
		border: var(--bw) solid var(--line);
		border-radius: 14px;
	}
	.grid {
		stroke: var(--line);
		stroke-opacity: 0.15;
		stroke-width: 1.5;
	}
	.lbl {
		font: 700 13px var(--mono);
		fill: var(--ink-2);
	}
	.tl {
		fill: var(--ink);
	}
	.area {
		fill: var(--blue);
		fill-opacity: 0.18;
	}
	.line {
		fill: none;
		stroke: var(--ink);
		stroke-width: 4;
		stroke-linejoin: round;
		stroke-linecap: round;
	}
	.pt {
		fill: var(--surface);
		stroke: var(--ink);
		stroke-width: 2.5;
	}
	.pt.min {
		fill: var(--green);
	}
	.pt.now {
		fill: var(--yellow);
	}
	.target {
		stroke: var(--pink);
		stroke-width: 3;
		stroke-dasharray: 8 6;
	}
	.cap {
		gap: 8px 18px;
		margin-top: 8px;
		font-size: 0.92rem;
	}
</style>
