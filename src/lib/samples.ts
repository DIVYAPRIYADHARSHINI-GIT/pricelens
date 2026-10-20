// Art specs for the 5 demo "sample photos" (also used as the main demo product images).
// Shared by the browser ("Try a sample photo") and the server catalog so a sample
// photo always matches its own category through the dominant-colour matcher.
import type { ArtSpec } from './art.ts';

export interface SampleSpec {
	key: string;
	label: string;
	art: ArtSpec;
}

export const SAMPLE_ART: SampleSpec[] = [
	{ key: 'dress', label: 'Floral dress', art: { category: 'dress', bg: '#FFF3B0', main: '#FF6B9D', accent: '#FFD60A' } },
	{ key: 'sneakers', label: 'White sneakers', art: { category: 'shoes', bg: '#4D96FF', main: '#FFFFFF', accent: '#D8D8D8' } },
	{ key: 'backpack', label: 'Backpack', art: { category: 'bag', bg: '#FFE8A3', main: '#1F4E9E', accent: '#FFD60A' } },
	{ key: 'earbuds', label: 'Earbuds', art: { category: 'headphones', bg: '#FF9EC0', main: '#1C1C1C', accent: '#3A3A3A' } },
	{ key: 'watch', label: 'Wrist watch', art: { category: 'watch', bg: '#E5F6E7', main: '#8B5A2B', accent: '#E8A93A' } }
];
