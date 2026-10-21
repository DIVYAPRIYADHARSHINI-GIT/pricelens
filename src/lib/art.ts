// Generated placeholder product art (flat SVG "studio shots", no product photos).
// Fashion-site look: portrait 3:4 frame, muted studio backdrop, a soft floor
// shadow and a fine-line product silhouette. Product colours stay distinct so the
// demo dominant-colour matcher still recognises its own sample photos (the
// backdrop and the faint shadow are removed by the matcher as "background").
import type { Category } from './types.ts';

export interface ArtSpec {
	category: Category;
	bg: string;
	main: string;
	accent: string;
	/** 0..3 - gallery views: front, detail crop, reverse, full-length. */
	variant?: number;
}

/** Bright legacy backdrops -> muted studio tones (catalog seeds keep their keys). */
const STUDIO: Record<string, string> = {
	'#FFF3B0': '#EDE4CF', // sand
	'#E0F0FF': '#DCE1E6', // mist
	'#E5F6E7': '#DDE2D6', // sage
	'#FFE0EC': '#ECDCD6', // blush
	'#FFE8A3': '#E8DDC5', // oat
	'#FFF8E7': '#EEEAE2', // bone
	'#4D96FF': '#C8CED5', // slate
	'#6BCB77': '#CAD2C2', // moss
	'#FF9EC0': '#E4D2CB', // rose dust
	'#EEEEEE': '#E6E2DA'
};
export function studio(bg: string): string {
	return STUDIO[bg.toUpperCase()] ?? bg;
}

/** Bright legacy product colours -> fashion-muted tones (same hue family). */
const TONE: Record<string, string> = {
	'#FF6B9D': '#D67590', // dusty rose
	'#4D96FF': '#5B7DB1', // denim
	'#FFD60A': '#E2BE5A', // ochre
	'#6BCB77': '#7FA77A', // sage
	'#B28DFF': '#9C8BBF', // lavender
	'#FF9E5E': '#D49069', // terracotta
	'#FF6B6B': '#C66A62', // brick
	'#FF8FB1': '#D99AAB', // blush
	'#1A9E8F': '#3F8A80', // teal
	'#FFFFFF': '#FFFFFF'
};
export function tone(c: string): string {
	return TONE[c.toUpperCase()] ?? c;
}

export function shade(hex: string, f: number): string {
	const n = parseInt(hex.slice(1), 16);
	const ch = (v: number) => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)));
	const r = ch((n >> 16) & 255);
	const g = ch((n >> 8) & 255);
	const b = ch(n & 255);
	return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Soft floor shadow, close enough to the backdrop to be treated as background. */
const floor = (bg: string, y: number, rx: number) => `<ellipse cx="128" cy="${y}" rx="${rx}" ry="${Math.round(rx * 0.09)}" fill="${shade(bg, -0.075)}"/>`;

function shape(s: ArtSpec, bg: string): string {
	const { main, accent } = s;
	const line = shade(main, -0.32);
	const sw = 1.6;
	const v = s.variant ?? 0;
	switch (s.category) {
		case 'dress': {
			const dots = [
				[104, 140],
				[132, 132],
				[152, 158],
				[118, 168],
				[92, 192],
				[140, 190],
				[166, 206],
				[112, 212],
				[78, 214],
				[150, 222]
			]
				.map(([x, y], i) => {
					const c = i % 3 === 0 ? accent : i % 3 === 1 ? '#8FAE8B' : '#7D97B8';
					return `<circle cx="${x}" cy="${y}" r="${5 + ((i + v) % 2)}" fill="${c}"/><circle cx="${x}" cy="${y}" r="1.8" fill="#F6EFE0"/>`;
				})
				.join('');
			return `${floor(bg, 234, 74)}
<path d="M111 38 L114 72 M145 38 L142 72" stroke="${line}" stroke-width="2.2" stroke-linecap="round"/>
<path d="M112 72 Q128 80 144 72 L147 110 Q128 116 109 110 Z" fill="${main}" stroke="${line}" stroke-width="${sw}" stroke-linejoin="round"/>
<path d="M109 110 Q128 116 147 110 Q178 168 198 226 Q128 238 58 226 Q78 168 109 110 Z" fill="${main}" stroke="${line}" stroke-width="${sw}" stroke-linejoin="round"/>
<path d="M109 110 Q128 116 147 110" fill="none" stroke="${line}" stroke-width="3"/>${dots}
<path d="M128 116 Q122 170 104 230 M128 116 Q136 170 152 230" fill="none" stroke="${line}" stroke-opacity="0.35" stroke-width="1"/>`;
		}
		case 'shoes':
			return `${floor(bg, 186, 92)}
<path d="M40 152 Q44 114 70 106 L98 100 Q112 122 140 126 Q190 132 206 158 L206 170 L40 170 Z" fill="${main}" stroke="${line}" stroke-width="${sw}" stroke-linejoin="round"/>
<rect x="36" y="168" width="174" height="14" rx="4" fill="${accent}" stroke="${line}" stroke-width="${sw}"/>
<path d="M92 114 L116 106 M100 126 L126 116 M110 136 L136 128" stroke="${line}" stroke-width="2.4" stroke-linecap="round"/>
<g fill="${line}"><circle cx="90" cy="116" r="1.8"/><circle cx="98" cy="128" r="1.8"/><circle cx="108" cy="138" r="1.8"/></g>
<path d="M150 148 Q172 144 190 156" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>
<path d="M48 160 L200 160" stroke="${line}" stroke-opacity="0.3" stroke-width="1" stroke-dasharray="3 3"/>`;
		case 'bag':
			return `${floor(bg, 228, 66)}
<path d="M98 70 Q98 42 128 42 Q158 42 158 70" fill="none" stroke="${line}" stroke-width="6" stroke-linecap="round"/>
<rect x="68" y="64" width="120" height="156" rx="22" fill="${main}" stroke="${line}" stroke-width="${sw}"/>
<rect x="86" y="140" width="84" height="60" rx="10" fill="${shade(main, -0.12)}" stroke="${line}" stroke-width="${sw}"/>
<rect x="106" y="150" width="44" height="5" rx="2.5" fill="${accent}"/>
<rect x="86" y="90" width="84" height="6" rx="3" fill="${accent}"/>
<path d="M76 110 L180 110" stroke="${line}" stroke-opacity="0.35" stroke-width="1" stroke-dasharray="3 3"/>`;
		case 'headphones':
			return `${floor(bg, 214, 62)}
<rect x="80" y="148" width="96" height="58" rx="24" fill="${accent}" stroke="${shade(accent, -0.35)}" stroke-width="${sw}"/>
<path d="M84 174 L172 174" stroke="${shade(accent, 0.25)}" stroke-width="1.2"/>
<g fill="${main}"><ellipse cx="98" cy="98" rx="22" ry="24"/><rect x="91" y="106" width="14" height="42" rx="7"/>
<ellipse cx="158" cy="98" rx="22" ry="24"/><rect x="151" y="106" width="14" height="42" rx="7"/></g>
<circle cx="98" cy="94" r="8" fill="${shade(main, 0.3)}"/><circle cx="158" cy="94" r="8" fill="${shade(main, 0.3)}"/>`;
		case 'watch':
			return `${floor(bg, 236, 40)}
<rect x="108" y="30" width="40" height="196" rx="10" fill="${main}" stroke="${line}" stroke-width="${sw}"/>
<g fill="${line}"><circle cx="128" cy="52" r="2.4"/><circle cx="128" cy="66" r="2.4"/><circle cx="128" cy="190" r="2.4"/><circle cx="128" cy="204" r="2.4"/></g>
<circle cx="128" cy="128" r="48" fill="${accent}" stroke="${shade(accent, -0.35)}" stroke-width="2"/>
<circle cx="128" cy="128" r="38" fill="${shade(accent, 0.55)}"/>
<g stroke="${shade(main, -0.4)}" stroke-width="1.4"><path d="M128 94 L128 100 M128 156 L128 162 M94 128 L100 128 M156 128 L162 128"/></g>
<path d="M128 128 L128 104 M128 128 L146 137" stroke="${shade(main, -0.45)}" stroke-width="2.6" stroke-linecap="round"/>
<rect x="175" y="122" width="8" height="12" rx="2" fill="${accent}"/>`;
		case 'shirt':
			return `${floor(bg, 222, 62)}
<path d="M96 52 L80 60 L44 92 L64 120 L82 106 L82 214 L174 214 L174 106 L192 120 L212 92 L176 60 L160 52 Q128 76 96 52 Z" fill="${main}" stroke="${line}" stroke-width="${sw}" stroke-linejoin="round"/>
<path d="M128 74 L128 210" stroke="${line}" stroke-width="1.2"/><g fill="${accent}"><circle cx="128" cy="100" r="3"/><circle cx="128" cy="130" r="3"/><circle cx="128" cy="160" r="3"/><circle cx="128" cy="190" r="3"/></g>`;
		case 'phone':
			return `${floor(bg, 226, 50)}
<rect x="86" y="36" width="84" height="182" rx="14" fill="${main}" stroke="${line}" stroke-width="${sw}"/>
<rect x="95" y="54" width="66" height="144" rx="4" fill="${accent}"/><rect x="117" y="43" width="22" height="4" rx="2" fill="${line}"/>`;
		default:
			return `${floor(bg, 208, 70)}
<rect x="64" y="82" width="128" height="118" rx="6" fill="${main}" stroke="${line}" stroke-width="${sw}"/>
<path d="M64 112 L192 112 M128 82 L128 200" stroke="${accent}" stroke-width="5"/>`;
	}
}

export const ART_W = 240;
export const ART_H = 320;

/** Raw SVG markup (portrait 240 x 320). */
export function artSvg(s: ArtSpec): string {
	const v = (s.variant ?? 0) % 4;
	const bg = v === 3 ? shade(studio(s.bg), -0.035) : studio(s.bg);
	const spec = { ...s, main: tone(s.main), accent: tone(s.accent) };
	// The 256-unit product drawing is centred in the portrait frame; gallery views
	// re-frame it like a fashion PDP: front, close-up detail, reverse, full length.
	const frame = [
		'translate(-8 32)',
		'translate(-92 -44) scale(1.62)',
		'translate(248 32) scale(-1 1)',
		'translate(19 58) scale(0.8)'
	][v];
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ART_W} ${ART_H}" width="${ART_W}" height="${ART_H}"><rect width="${ART_W}" height="${ART_H}" fill="${bg}"/><g transform="${frame}">${shape(spec, bg)}</g></svg>`;
}

/** data: URI usable directly in <img src>. */
export function artUri(s: ArtSpec): string {
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(artSvg(s).replace(/\n/g, ''))}`;
}

/** Neutral placeholder for a category (used when a live product has no image). */
export function categoryArt(category: Category, variant = 0): string {
	const map: Record<Category, [string, string, string]> = {
		dress: ['#EDE4CF', '#C9758A', '#F2C94C'],
		shirt: ['#DCE1E6', '#F4F1EA', '#8A8A8A'],
		shoes: ['#C8CED5', '#FFFFFF', '#E7E3DC'],
		bag: ['#E8DDC5', '#2B3F63', '#C9A227'],
		watch: ['#DDE2D6', '#8B5A2B', '#C99A4B'],
		phone: ['#ECDCD6', '#1F1F1F', '#9AA6B2'],
		headphones: ['#E4D2CB', '#1C1C1C', '#2E2E2E'],
		other: ['#E6E2DA', '#6E6A63', '#C8BFB2']
	};
	const [bg, main, accent] = map[category];
	return artUri({ category, bg, main, accent, variant });
}
