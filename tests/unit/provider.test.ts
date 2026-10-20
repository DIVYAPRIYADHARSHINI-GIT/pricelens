import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG, GROUPS, bestOf, getProduct, mainProduct, suggestionsFor } from '../../src/lib/server/catalog.ts';
import { MockProvider, detect, matchColours, matchText } from '../../src/lib/server/providers/mock.ts';
import { categoryFromLabels } from '../../src/lib/server/providers/real.ts';
import { providerFromEnv } from '../../src/lib/server/providers/index.ts';
import type { ImageFeatures } from '../../src/lib/types.ts';

const feat = (palette: [string, number][], extra: Partial<ImageFeatures> = {}): ImageFeatures => ({
	width: 768,
	height: 768,
	sharpness: 300,
	coverage: 0.4,
	background: '#ffffff',
	palette: palette.map(([name, share]) => ({ name, hex: '#000000', share })),
	...extra
});

test('sample data: 5 categories, 4-6 listings each, Rs 299-2,999, 3-4 similar + cheaper', () => {
	assert.equal(GROUPS.length, 5);
	for (const g of GROUPS) {
		const p = mainProduct(g.key);
		assert.ok(p.listings.length >= 4 && p.listings.length <= 6, `${g.key}: ${p.listings.length} listings`);
		for (const l of p.listings) {
			assert.ok(l.rating > 0 && l.deliveryDays > 0 && l.url.startsWith('https://'));
		}
		const { similar, cheaper } = suggestionsFor(p.id);
		assert.ok(similar.length >= 3 && similar.length <= 4, `${g.key} similar ${similar.length}`);
		assert.ok(cheaper.length >= 3 && cheaper.length <= 4, `${g.key} cheaper ${cheaper.length}`);
		assert.ok(cheaper.every((c) => c.price < bestOf(p)), 'cheaper alternatives are cheaper');
		assert.ok(p.images.every((i) => i.startsWith('data:image/svg+xml')), 'placeholder SVG images');
	}
	const all = [...CATALOG.values()].flatMap((e) => e.product.listings.map((l) => l.price));
	assert.ok(Math.min(...all) >= 299 && Math.max(...all) <= 2999, `range ${Math.min(...all)}-${Math.max(...all)}`);
});

test('catalog is deterministic and history ends at today’s best price', () => {
	const a = getProduct('wireless-earbuds')!;
	const b = getProduct('wireless-earbuds')!;
	assert.deepEqual(a.listings, b.listings);
	assert.equal(a.priceHistory.length, 13);
	assert.equal(a.priceHistory.at(-1)!.price, bestOf(a));
});

test('dominant-colour matcher picks the right sample group', () => {
	assert.equal(matchColours(feat([['pink', 0.55], ['yellow', 0.2], ['green', 0.1]])).group.key, 'dress');
	assert.equal(matchColours(feat([['white', 0.7], ['grey', 0.2]])).group.key, 'sneakers');
	assert.equal(matchColours(feat([['blue', 0.75], ['yellow', 0.15]])).group.key, 'backpack');
	assert.equal(matchColours(feat([['black', 0.85], ['grey', 0.1]])).group.key, 'earbuds');
	assert.equal(matchColours(feat([['brown', 0.5], ['orange', 0.3], ['yellow', 0.1]])).group.key, 'watch');
	assert.ok(matchColours(feat([['black', 0.85]])).confidence >= 0.5);
});

test('detect: blurry, no product, low confidence -> uncertain', () => {
	assert.equal(detect({ features: feat([['pink', 0.6]], { sharpness: 3 }) }).detection.reason, 'blurry');
	assert.equal(detect({ features: feat([['pink', 0.6]], { coverage: 0.01 }) }).detection.reason, 'no-product');
	const mixed = detect({ features: feat([['green', 0.4], ['teal', 0.3], ['purple', 0.3]]) });
	assert.equal(mixed.detection.uncertain, true);
	assert.equal(mixed.detection.reason, 'low-confidence');
	assert.equal(mixed.productId, null);
});

test('detect: text, filename, category picker and product id', () => {
	assert.equal(detect({ query: 'white sneakers' }).productId, 'white-sneakers');
	assert.equal(detect({ query: 'chunky platform sneakers' }).productId, 'chunky-platform-sneakers');
	assert.equal(detect({ query: 'bluetooth earbuds' }).detection.category, 'headphones');
	assert.equal(detect({ query: 'laptop' }).detection.reason, 'no-product');
	assert.equal(detect({ category: 'watch' }).productId, 'brown-leather-watch');
	assert.equal(detect({ category: 'phone' }).productId, null);
	assert.equal(detect({ features: feat([['white', 0.9]]), fileName: 'my_backpack.jpg' }).productId, 'navy-laptop-backpack');
	assert.equal(detect({ productId: 'mini-daypack' }).productId, 'mini-daypack');
	assert.equal(matchText('the and for'), null);
});

test('MockProvider search + price refresh', async () => {
	const p = new MockProvider();
	const r = await p.search({ query: 'floral dress' });
	assert.equal(r.mode, 'demo');
	assert.equal(r.product?.id, 'floral-summer-dress');
	assert.ok(r.similar.length >= 3 && r.cheaper.length >= 3);
	const unsure = await p.search({ features: feat([['pink', 0.5]], { sharpness: 2 }) });
	assert.equal(unsure.product, null);
	assert.equal(unsure.detected.uncertain, true);
	const [base] = await p.prices([{ id: 'floral-summer-dress' }]);
	assert.equal(base.price, 549);
	const moved = await p.prices([{ id: 'floral-summer-dress', tick: 3 }]);
	assert.ok(moved[0].price! >= 549 * 0.85 && moved[0].price! <= 549 * 1.07);
	const missing = await p.prices([{ id: 'nope' }]);
	assert.equal(missing[0].price, null);
});

test('provider selection: demo by default, real only with env', () => {
	assert.equal(providerFromEnv({}).name, 'mock');
	assert.equal(providerFromEnv({ SERPAPI_API_KEY: 'x' }).name, 'mock');
	assert.equal(providerFromEnv({ PRICELENS_PROVIDER: 'real' }).name, 'mock');
	assert.equal(providerFromEnv({ PRICELENS_PROVIDER: 'real', SERPAPI_API_KEY: 'x' }).name, 'real');
});

test('vision labels -> category', () => {
	assert.equal(categoryFromLabels(['Day dress', 'Pink', 'Textile']), 'dress');
	assert.equal(categoryFromLabels(['Sneakers', 'Footwear']), 'shoes');
	assert.equal(categoryFromLabels(['Analog watch', 'Watch strap']), 'watch');
	assert.equal(categoryFromLabels(['Furniture']), null);
});
