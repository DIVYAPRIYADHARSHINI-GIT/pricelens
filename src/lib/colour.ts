// Colour helpers shared by the browser feature extractor and the MockProvider matcher.

export type ColourClass =
	| 'red'
	| 'pink'
	| 'orange'
	| 'brown'
	| 'yellow'
	| 'green'
	| 'teal'
	| 'blue'
	| 'purple'
	| 'white'
	| 'grey'
	| 'black';

export const COLOUR_NAME: Record<ColourClass, string> = {
	red: 'Red',
	pink: 'Pink',
	orange: 'Orange',
	brown: 'Brown / gold',
	yellow: 'Yellow',
	green: 'Green',
	teal: 'Teal',
	blue: 'Blue',
	purple: 'Purple',
	white: 'White',
	grey: 'Grey',
	black: 'Black'
};

export function hexToRgb(hex: string): [number, number, number] | null {
	const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
	if (!m) return null;
	const n = parseInt(m[1], 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
	const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
	return `#${c(r)}${c(g)}${c(b)}`;
}

/** RGB 0..255 -> HSL (h 0..360, s 0..1, l 0..1). */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	let h = 0;
	let s = 0;
	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
		else if (max === g) h = (b - r) / d + 2;
		else h = (r - g) / d + 4;
		h *= 60;
	}
	return [h, s, l];
}

/** Coarse perceptual colour class for one pixel / colour. */
export function classify(r: number, g: number, b: number): ColourClass {
	const [h, s, l] = rgbToHsl(r, g, b);
	if (l < 0.18) return 'black';
	if (l > 0.86 && s < 0.5) return 'white';
	if (s < 0.16) return l > 0.72 ? 'white' : l < 0.3 ? 'black' : 'grey';
	if (h >= 345 || h < 12) return l > 0.62 ? 'pink' : 'red';
	if (h >= 12 && h < 45) return l < 0.5 || s < 0.45 ? 'brown' : 'orange';
	if (h >= 45 && h < 65) return l < 0.4 ? 'brown' : 'yellow';
	if (h >= 65 && h < 165) return 'green';
	if (h >= 165 && h < 195) return 'teal';
	if (h >= 195 && h < 255) return 'blue';
	if (h >= 255 && h < 290) return 'purple';
	return 'pink'; // 290..345 magenta / pink
}

export function classifyHex(hex: string): ColourClass | null {
	const rgb = hexToRgb(hex);
	return rgb ? classify(rgb[0], rgb[1], rgb[2]) : null;
}

export function colourDistance(a: [number, number, number], b: [number, number, number]): number {
	const dr = a[0] - b[0];
	const dg = a[1] - b[1];
	const db = a[2] - b[2];
	return Math.sqrt(dr * dr + dg * dg + db * db);
}
