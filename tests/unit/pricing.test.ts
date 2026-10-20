import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyFilters, bestListing, budgetState, comparisonText, defaultFilters, priceLabel, shareMessage, sortListings, whatsappUrl } from '../../src/lib/pricing.ts';
import { getProduct } from '../../src/lib/server/catalog.ts';

const dress = getProduct('floral-summer-dress')!;

test('price labels: lowest / good deal / above average', () => {
	const ls = dress.listings;
	const labels = sortListings(ls, 'price').map((l) => priceLabel(l.price, ls));
	assert.equal(labels[0], 'lowest');
	assert.ok(labels.includes('good'));
	assert.equal(labels.at(-1), 'above');
});

test('sorting by price, rating and delivery', () => {
	const byPrice = sortListings(dress.listings, 'price').map((l) => l.price);
	assert.deepEqual(byPrice, [...byPrice].sort((a, b) => a - b));
	const byRating = sortListings(dress.listings, 'rating').map((l) => l.rating);
	assert.deepEqual(byRating, [...byRating].sort((a, b) => b - a));
	const byDelivery = sortListings(dress.listings, 'delivery').map((l) => l.deliveryDays);
	assert.deepEqual(byDelivery, [...byDelivery].sort((a, b) => a - b));
});

test('filters: store, price range, min rating, brand, hidden stores', () => {
	const f = defaultFilters(dress.listings);
	assert.equal(applyFilters(dress.listings, f).length, dress.listings.length);
	assert.deepEqual(applyFilters(dress.listings, { ...f, stores: ['myntra'] }).map((l) => l.store), ['myntra']);
	assert.ok(applyFilters(dress.listings, { ...f, maxPrice: 900 }).every((l) => l.price <= 900));
	assert.ok(applyFilters(dress.listings, { ...f, minRating: 4.2 }).every((l) => l.rating >= 4.2));
	assert.ok(applyFilters(dress.listings, { ...f, brands: ['SunKissed'] }).every((l) => l.brand === 'SunKissed'));
	assert.ok(applyFilters(dress.listings, f, ['meesho']).every((l) => l.store !== 'meesho'));
});

test('budget state', () => {
	assert.equal(budgetState(500, { min: 0, max: 0, hideOutside: false }), 'ok');
	assert.equal(budgetState(1200, { min: 0, max: 1000, hideOutside: false }), 'over');
	assert.equal(budgetState(300, { min: 400, max: 1000, hideOutside: false }), 'under');
});

test('best listing + share / comparison text', () => {
	const best = bestListing(dress.listings)!;
	assert.equal(best.store, 'meesho');
	assert.equal(best.price, 549);
	const msg = shareMessage(dress, best, 'https://x.test/product/floral-summer-dress');
	assert.match(msg, /Floral Print Fit & Flare Summer Dress/);
	assert.match(msg, /₹549 on Meesho/);
	assert.match(msg, /https:\/\/x\.test\/product\/floral-summer-dress/);
	assert.ok(whatsappUrl(msg).startsWith('https://wa.me/?text='));
	assert.equal(decodeURIComponent(whatsappUrl(msg).split('text=')[1]), msg);
	const cmp = comparisonText(dress, dress.listings, 'https://x.test/p');
	const lines = cmp.split('\n');
	assert.match(lines[1], /^1\. Meesho - ₹549/);
	assert.equal(lines.filter((l) => /^\d+\. /.test(l)).length, dress.listings.length);
	assert.match(cmp, /https:\/\/www\.meesho\.com\/search/);
	assert.match(cmp, /indicative/);
});
