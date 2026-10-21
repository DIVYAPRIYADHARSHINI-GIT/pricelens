// Art specs for the 5 demo "sample photos" (also used as the main demo product images).
// Shared by the browser ("Try a sample photo") and the server catalog so a sample
// photo always matches its own category through the dominant-colour matcher.
// Colours are fashion-muted but each still falls in its group's colour class
// (dusty rose -> pink, white, navy -> blue, black, saddle -> brown).
import type { ArtSpec } from './art.ts';

export interface SampleSpec {
	key: string;
	label: string;
	art: ArtSpec;
}

export const SAMPLE_ART: SampleSpec[] = [
	{ key: 'dress', label: 'Floral dress', art: { category: 'dress', bg: '#FFF3B0', main: '#D67590', accent: '#E9C46A' } },
	{ key: 'sneakers', label: 'White sneakers', art: { category: 'shoes', bg: '#4D96FF', main: '#FFFFFF', accent: '#E7E3DC' } },
	{ key: 'backpack', label: 'Backpack', art: { category: 'bag', bg: '#FFE8A3', main: '#24467F', accent: '#C9A227' } },
	{ key: 'earbuds', label: 'Earbuds', art: { category: 'headphones', bg: '#FF9EC0', main: '#1C1C1C', accent: '#2E2E2E' } },
	{ key: 'watch', label: 'Wrist watch', art: { category: 'watch', bg: '#E5F6E7', main: '#8B5A2B', accent: '#C99A4B' } }
];
