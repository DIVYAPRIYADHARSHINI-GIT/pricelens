// In-browser photo processing: validate, resize (max 1024 px), compress to JPEG,
// make a preview + history thumbnail and compute the simple features the demo
// matcher uses (background-free colour palette, coverage, blur/sharpness).
// Pixels never leave the device for demo matching; only the compressed JPEG is sent.
import { classify, colourDistance, rgbToHex } from '../colour.ts';
import type { ImageFeatures } from '../types.ts';

export const MAX_SIDE = 1024;
export const MAX_INPUT_BYTES = 25 * 1024 * 1024;
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

export type ImageErrorCode = 'unsupported' | 'too-large';

export class ImageError extends Error {
	code: ImageErrorCode;
	constructor(code: ImageErrorCode, message: string) {
		super(message);
		this.code = code;
	}
}

export interface ProcessedImage {
	blob: Blob;
	preview: string; // data URL of the compressed photo
	thumb: string; // ~120 px data URL for history
	features: ImageFeatures;
	name: string;
}

type Drawable = ImageBitmap | HTMLImageElement;

async function decode(file: Blob): Promise<Drawable> {
	try {
		return await createImageBitmap(file);
	} catch {
		// Fallback for browsers whose createImageBitmap misses some formats.
		const url = URL.createObjectURL(file);
		try {
			const img = new Image();
			img.decoding = 'async';
			await new Promise<void>((res, rej) => {
				const t = setTimeout(() => rej(new Error('timeout')), 8000);
				img.onload = () => (clearTimeout(t), res());
				img.onerror = () => (clearTimeout(t), rej(new Error('decode')));
				img.src = url;
			});
			return img;
		} finally {
			setTimeout(() => URL.revokeObjectURL(url), 1000);
		}
	}
}

function toBlob(canvas: HTMLCanvasElement, type: string, q: number): Promise<Blob> {
	return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), type, q));
}

function blobToDataUrl(b: Blob): Promise<string> {
	return new Promise((res, rej) => {
		const r = new FileReader();
		r.onload = () => res(String(r.result));
		r.onerror = () => rej(r.error);
		r.readAsDataURL(b);
	});
}

function canvas(w: number, h: number): HTMLCanvasElement {
	const c = document.createElement('canvas');
	c.width = Math.max(1, Math.round(w));
	c.height = Math.max(1, Math.round(h));
	return c;
}

export async function processImage(file: Blob, name = 'photo.jpg'): Promise<ProcessedImage> {
	const type = file.type || '';
	if (type && !type.startsWith('image/')) {
		throw new ImageError('unsupported', 'Unsupported file. Please choose a photo (JPG, PNG or WebP).');
	}
	if (file.size > MAX_INPUT_BYTES) throw new ImageError('too-large', 'That photo is over 25 MB. Please pick a smaller one.');
	let src: Drawable;
	try {
		src = await decode(file);
	} catch {
		throw new ImageError(
			'unsupported',
			type.includes('heic') || type.includes('heif') || /\.hei[cf]$/i.test(name)
				? "This browser can't open HEIC photos. Set your camera to \"Most compatible\" (JPG) or try another browser."
				: "We couldn't open that file as a photo. Please use a JPG, PNG or WebP image."
		);
	}
	const w = src.width;
	const h = src.height;
	if (!w || !h) throw new ImageError('unsupported', "That image looks empty. Please try another photo.");
	const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
	const c = canvas(w * scale, h * scale);
	const ctx = c.getContext('2d', { willReadFrequently: true })!;
	ctx.fillStyle = '#ffffff'; // transparent PNGs -> white
	ctx.fillRect(0, 0, c.width, c.height);
	ctx.drawImage(src, 0, 0, c.width, c.height);
	if ('close' in src) src.close();

	let blob = await toBlob(c, 'image/jpeg', 0.82);
	if (blob.size > MAX_UPLOAD_BYTES * 0.95) blob = await toBlob(c, 'image/jpeg', 0.6);

	const t = canvas(120 * (c.width >= c.height ? 1 : c.width / c.height), 120 * (c.height > c.width ? 1 : c.height / c.width));
	t.getContext('2d')!.drawImage(c, 0, 0, t.width, t.height);
	const [preview, thumb] = await Promise.all([blobToDataUrl(blob), Promise.resolve(t.toDataURL('image/jpeg', 0.7))]);
	return { blob, preview, thumb, features: computeFeatures(c), name };
}

/** Background-free colour palette + coverage + Laplacian-variance sharpness. */
export function computeFeatures(src: HTMLCanvasElement): ImageFeatures {
	const N = 64;
	const small = canvas(N, N);
	const sctx = small.getContext('2d', { willReadFrequently: true })!;
	sctx.drawImage(src, 0, 0, N, N);
	const d = sctx.getImageData(0, 0, N, N).data;
	const ring = 4;

	// Background = dominant colour class of the border ring.
	const borderCounts = new Map<string, { n: number; r: number; g: number; b: number }>();
	let borderTotal = 0;
	for (let y = 0; y < N; y++) {
		for (let x = 0; x < N; x++) {
			if (x >= ring && x < N - ring && y >= ring && y < N - ring) continue;
			const i = (y * N + x) * 4;
			const k = classify(d[i], d[i + 1], d[i + 2]);
			const e = borderCounts.get(k) ?? { n: 0, r: 0, g: 0, b: 0 };
			e.n++;
			e.r += d[i];
			e.g += d[i + 1];
			e.b += d[i + 2];
			borderCounts.set(k, e);
			borderTotal++;
		}
	}
	const top = [...borderCounts.values()].sort((a, b) => b.n - a.n)[0];
	const bg: [number, number, number] = [top.r / top.n, top.g / top.n, top.b / top.n];
	const uniformBorder = top.n / borderTotal >= 0.6;

	const collect = (removeBg: boolean) => {
		const groups = new Map<string, { n: number; r: number; g: number; b: number }>();
		let fg = 0;
		let total = 0;
		for (let y = ring; y < N - ring; y++) {
			for (let x = ring; x < N - ring; x++) {
				const i = (y * N + x) * 4;
				total++;
				const px: [number, number, number] = [d[i], d[i + 1], d[i + 2]];
				if (removeBg && colourDistance(px, bg) < 48) continue;
				fg++;
				const k = classify(px[0], px[1], px[2]);
				const e = groups.get(k) ?? { n: 0, r: 0, g: 0, b: 0 };
				e.n++;
				e.r += px[0];
				e.g += px[1];
				e.b += px[2];
				groups.set(k, e);
			}
		}
		return { groups, fg, total };
	};

	let res = collect(uniformBorder);
	const coverage = res.fg / res.total;
	// Product fills the frame (or plain wall): fall back to every pixel for the palette.
	if (res.fg < res.total * 0.05) res = collect(false);
	const palette = [...res.groups.entries()]
		.map(([name, e]) => ({ name, hex: rgbToHex(e.r / e.n, e.g / e.n, e.b / e.n), share: Math.round((e.n / Math.max(1, res.fg)) * 1000) / 1000 }))
		.filter((p) => p.share >= 0.02)
		.sort((a, b) => b.share - a.share)
		.slice(0, 6);

	return {
		width: src.width,
		height: src.height,
		sharpness: Math.round(sharpness(src) * 10) / 10,
		coverage: Math.round((uniformBorder ? coverage : 1) * 1000) / 1000,
		background: rgbToHex(bg[0], bg[1], bg[2]),
		palette
	};
}

/** Variance of the 4-neighbour Laplacian on a 256 px greyscale copy (low = blurry). */
function sharpness(src: HTMLCanvasElement): number {
	const S = 256;
	const sc = Math.min(1, S / Math.max(src.width, src.height));
	const w = Math.max(8, Math.round(src.width * sc));
	const h = Math.max(8, Math.round(src.height * sc));
	const c = canvas(w, h);
	const ctx = c.getContext('2d', { willReadFrequently: true })!;
	ctx.drawImage(src, 0, 0, w, h);
	const d = ctx.getImageData(0, 0, w, h).data;
	const g = new Float32Array(w * h);
	for (let i = 0; i < w * h; i++) g[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
	let sum = 0;
	let sum2 = 0;
	let n = 0;
	for (let y = 1; y < h - 1; y++) {
		for (let x = 1; x < w - 1; x++) {
			const i = y * w + x;
			const l = g[i - 1] + g[i + 1] + g[i - w] + g[i + w] - 4 * g[i];
			sum += l;
			sum2 += l * l;
			n++;
		}
	}
	const mean = sum / n;
	return sum2 / n - mean * mean;
}

/** Render a generated SVG sample tile into a PNG file (for "Try a sample photo"). */
export async function svgToPngFile(svgDataUri: string, name: string, size = 768, blurPx = 0): Promise<File> {
	const img = new Image();
	await new Promise<void>((res, rej) => {
		const t = setTimeout(() => rej(new Error('timeout')), 6000);
		img.onload = () => (clearTimeout(t), res());
		img.onerror = () => (clearTimeout(t), rej(new Error('sample decode')));
		img.src = svgDataUri;
	});
	// Keep the source aspect ratio (sample art is portrait 3:4); `size` is the long side.
	const ar = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
	const w = Math.round(ar >= 1 ? size : size * ar);
	const h = Math.round(ar >= 1 ? size / ar : size);
	const c = canvas(w, h);
	const ctx = c.getContext('2d')!;
	if (blurPx) {
		// Portable blur (Safari has no ctx.filter): shrink a lot, then scale back up smoothly.
		const tiny = canvas(Math.max(8, Math.round(w / blurPx / 2)), Math.max(8, Math.round(h / blurPx / 2)));
		const tctx = tiny.getContext('2d')!;
		tctx.imageSmoothingQuality = 'high';
		tctx.drawImage(img, 0, 0, tiny.width, tiny.height);
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'high';
		ctx.drawImage(tiny, 0, 0, w, h);
	} else {
		ctx.drawImage(img, 0, 0, w, h);
	}
	const blob = await toBlob(c, 'image/png', 1);
	return new File([blob], name, { type: 'image/png' });
}
