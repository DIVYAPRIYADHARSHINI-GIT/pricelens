// Generated placeholder product art (flat SVG tiles, no product photos).
// Each tile = flat background + one simple category shape. Colours are chosen so
// the demo dominant-colour matcher recognises its own sample photos.
import type { Category } from './types.ts';

export interface ArtSpec {
	category: Category;
	bg: string;
	main: string;
	accent: string;
	/** 0..3 - changes framing / pattern for gallery views. */
	variant?: number;
}

function shade(hex: string, f: number): string {
	const n = parseInt(hex.slice(1), 16);
	const ch = (v: number) => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)));
	const r = ch((n >> 16) & 255);
	const g = ch((n >> 8) & 255);
	const b = ch(n & 255);
	return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function shape(s: ArtSpec): string {
	const { main, accent } = s;
	const dark = shade(main, -0.35);
	const v = s.variant ?? 0;
	switch (s.category) {
		case 'dress': {
			const flowers = [
				[86, 118],
				[118, 150],
				[96, 176],
				[132, 112],
				[148, 172],
				[110, 205],
				[74, 200],
				[140, 205]
			]
				.map(([x, y], i) => {
					const c = i % 3 === 0 ? accent : i % 3 === 1 ? '#6BCB77' : '#4D96FF';
					return `<circle cx="${x}" cy="${y}" r="${7 + ((i + v) % 3)}" fill="${c}"/><circle cx="${x}" cy="${y}" r="3" fill="#FFF3B0"/>`;
				})
				.join('');
			return `<path d="M100 46 L124 46 L132 70 L120 92 L170 222 L54 222 L104 92 L92 70 Z" fill="${main}" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>
<path d="M100 46 Q112 60 124 46" fill="none" stroke="${dark}" stroke-width="3"/>${flowers}`;
		}
		case 'shoes':
			return `<path d="M40 150 Q44 112 70 104 L98 98 Q112 120 140 124 Q190 130 206 156 L206 168 L40 168 Z" fill="${main}" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>
<rect x="36" y="166" width="174" height="16" rx="6" fill="${accent}" stroke="${dark}" stroke-width="3"/>
<path d="M92 112 L116 104 M100 124 L126 114 M110 134 L136 126" stroke="${dark}" stroke-width="4" stroke-linecap="round"/>
<path d="M150 146 Q172 142 188 154" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>`;
		case 'bag':
			return `<path d="M96 70 Q96 44 128 44 Q160 44 160 70" fill="none" stroke="${dark}" stroke-width="9" stroke-linecap="round"/>
<rect x="66" y="64" width="124" height="156" rx="34" fill="${main}" stroke="${dark}" stroke-width="3"/>
<rect x="86" y="140" width="84" height="62" rx="16" fill="${shade(main, -0.15)}" stroke="${dark}" stroke-width="3"/>
<rect x="104" y="150" width="48" height="8" rx="4" fill="${accent}"/>
<rect x="86" y="88" width="84" height="10" rx="5" fill="${accent}"/>`;
		case 'headphones':
			return `<rect x="78" y="146" width="100" height="62" rx="28" fill="${accent}" stroke="${shade(accent, -0.4)}" stroke-width="3"/>
<rect x="88" y="172" width="80" height="4" rx="2" fill="${shade(accent, -0.3)}"/>
<g fill="${main}"><ellipse cx="96" cy="96" rx="24" ry="26"/><rect x="88" y="104" width="16" height="44" rx="8"/>
<ellipse cx="162" cy="96" rx="24" ry="26"/><rect x="154" y="104" width="16" height="44" rx="8"/></g>
<circle cx="96" cy="92" r="9" fill="${shade(main, 0.35)}"/><circle cx="162" cy="92" r="9" fill="${shade(main, 0.35)}"/>`;
		case 'watch':
			return `<rect x="106" y="30" width="44" height="196" rx="14" fill="${main}" stroke="${dark}" stroke-width="3"/>
<g fill="${dark}"><circle cx="128" cy="52" r="3"/><circle cx="128" cy="66" r="3"/><circle cx="128" cy="190" r="3"/><circle cx="128" cy="204" r="3"/></g>
<circle cx="128" cy="128" r="50" fill="${accent}" stroke="${shade(accent, -0.4)}" stroke-width="4"/>
<circle cx="128" cy="128" r="38" fill="${shade(accent, 0.25)}"/>
<path d="M128 128 L128 100 M128 128 L148 138" stroke="${shade(main, -0.4)}" stroke-width="5" stroke-linecap="round"/>
<rect x="176" y="122" width="10" height="12" rx="3" fill="${accent}"/>`;
		case 'shirt':
			return `<path d="M96 52 L80 60 L44 92 L64 120 L82 106 L82 214 L174 214 L174 106 L192 120 L212 92 L176 60 L160 52 Q128 76 96 52 Z" fill="${main}" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>
<path d="M128 74 L128 210" stroke="${dark}" stroke-width="2"/><g fill="${accent}"><circle cx="128" cy="100" r="4"/><circle cx="128" cy="130" r="4"/><circle cx="128" cy="160" r="4"/><circle cx="128" cy="190" r="4"/></g>`;
		case 'phone':
			return `<rect x="84" y="36" width="88" height="184" rx="18" fill="${main}" stroke="${dark}" stroke-width="3"/>
<rect x="94" y="56" width="68" height="140" rx="6" fill="${accent}"/><rect x="116" y="44" width="24" height="5" rx="2.5" fill="${dark}"/>`;
		default:
			return `<rect x="62" y="80" width="132" height="120" rx="12" fill="${main}" stroke="${dark}" stroke-width="3"/>
<path d="M62 112 L194 112 M128 80 L128 200" stroke="${accent}" stroke-width="8"/>`;
	}
}

/** Raw SVG markup (256 x 256). */
export function artSvg(s: ArtSpec): string {
	const v = s.variant ?? 0;
	// Gallery variants: rotate / scale the shape slightly so thumbnails differ.
	const t = ['', 'rotate(-8 128 128)', 'translate(128 128) scale(0.82) translate(-128 -128)', 'rotate(7 128 128)'][v % 4];
	const deco =
		v % 2 === 1
			? `<g fill="${shade(s.bg, -0.06)}"><circle cx="30" cy="30" r="14"/><circle cx="226" cy="226" r="18"/></g>`
			: '';
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256"><rect width="256" height="256" fill="${s.bg}"/>${deco}<g transform="${t}">${shape(s)}</g></svg>`;
}

/** data: URI usable directly in <img src>. */
export function artUri(s: ArtSpec): string {
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(artSvg(s).replace(/\n/g, ''))}`;
}

/** Neutral placeholder for a category (used when a live product has no image). */
export function categoryArt(category: Category, variant = 0): string {
	const map: Record<Category, [string, string, string]> = {
		dress: ['#FFF3B0', '#FF6B9D', '#FFD60A'],
		shirt: ['#E0F0FF', '#4D96FF', '#FFFFFF'],
		shoes: ['#4D96FF', '#FFFFFF', '#D8D8D8'],
		bag: ['#FFE8A3', '#1F4E9E', '#FFD60A'],
		watch: ['#E5F6E7', '#8B5A2B', '#E0B040'],
		phone: ['#FFE0EC', '#222222', '#4D96FF'],
		headphones: ['#FF9EC0', '#1C1C1C', '#3A3A3A'],
		other: ['#EEEEEE', '#B28DFF', '#FFD60A']
	};
	const [bg, main, accent] = map[category];
	return artUri({ category, bg, main, accent, variant });
}
