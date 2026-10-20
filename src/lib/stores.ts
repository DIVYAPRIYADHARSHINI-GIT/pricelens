// Known Indian online stores: display name, logo-style text badge colours and a
// search URL builder. Badges are plain coloured initials (no trademarked logos).

export interface StoreMeta {
	id: string;
	name: string;
	initials: string;
	bg: string;
	fg: string;
	search: (q: string) => string;
}

const enc = encodeURIComponent;

export const STORES: StoreMeta[] = [
	{ id: 'amazon', name: 'Amazon', initials: 'az', bg: '#FF9900', fg: '#111111', search: (q) => `https://www.amazon.in/s?k=${enc(q)}` },
	{ id: 'flipkart', name: 'Flipkart', initials: 'Fk', bg: '#2874F0', fg: '#FFFFFF', search: (q) => `https://www.flipkart.com/search?q=${enc(q)}` },
	{ id: 'myntra', name: 'Myntra', initials: 'My', bg: '#FF3F6C', fg: '#111111', search: (q) => `https://www.myntra.com/${enc(q.trim().toLowerCase().replace(/\s+/g, '-'))}` },
	{ id: 'meesho', name: 'Meesho', initials: 'Me', bg: '#9F2089', fg: '#FFFFFF', search: (q) => `https://www.meesho.com/search?q=${enc(q)}` },
	{ id: 'ajio', name: 'Ajio', initials: 'Aj', bg: '#2C4152', fg: '#FFFFFF', search: (q) => `https://www.ajio.com/search/?text=${enc(q)}` },
	{ id: 'nykaa', name: 'Nykaa Fashion', initials: 'Ny', bg: '#FC2779', fg: '#111111', search: (q) => `https://www.nykaafashion.com/catalogsearch/result/?q=${enc(q)}` },
	{ id: 'tatacliq', name: 'Tata CLiQ', initials: 'TC', bg: '#DA1C5C', fg: '#FFFFFF', search: (q) => `https://www.tatacliq.com/search/?searchCategory=all&text=${enc(q)}` },
	{ id: 'croma', name: 'Croma', initials: 'Cr', bg: '#12DAA8', fg: '#111111', search: (q) => `https://www.croma.com/searchB?q=${enc(q)}%3Arelevance` }
];

const BY_ID = new Map(STORES.map((s) => [s.id, s]));

export function storeMeta(id: string, name = id): StoreMeta {
	const known = BY_ID.get(id);
	if (known) return known;
	// Unknown (live) store: stable colour from the name.
	let h = 0;
	for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
	const palette = ['#FFD60A', '#FF6B9D', '#4D96FF', '#6BCB77', '#FFB347', '#B28DFF'];
	const words = name.replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).filter(Boolean);
	const initials = (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '?').slice(0, 2)) || '?';
	return { id, name, initials, bg: palette[h % palette.length], fg: '#111111', search: (q) => `https://www.google.com/search?tbm=shop&q=${enc(q)}` };
}

/** Map a free-form store/source name (e.g. from a shopping API) to a known store id. */
export function storeIdFromName(name: string): string {
	const n = name.toLowerCase();
	for (const s of STORES) {
		if (n.includes(s.id) || n.includes(s.name.toLowerCase())) return s.id;
	}
	if (n.includes('nykaa')) return 'nykaa';
	if (n.includes('tata')) return 'tatacliq';
	return n.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'store';
}
