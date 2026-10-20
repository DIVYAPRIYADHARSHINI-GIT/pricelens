import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyPrice, emptyData, normalizeData, type AlertItem } from '../../src/lib/client/backup.ts';
import { RateLimiter, sniffImageType } from '../../src/lib/server/limits.ts';
import { classify } from '../../src/lib/colour.ts';
import { inr, retailRound } from '../../src/lib/format.ts';

test('normalizeData drops junk and keeps valid entries', () => {
	const d = normalizeData({
		wishlist: [
			{ id: 'a', name: 'Dress', price: 549, category: 'dress', url: 'https://x', image: 'javascript:alert(1)' },
			{ id: 'a', name: 'dupe' },
			{ name: 'no id' },
			'nonsense'
		],
		history: Array.from({ length: 50 }, (_, i) => ({ id: `h${i}`, label: 'x', kind: 'photo' })),
		alerts: [{ id: 'x', target: 500, currentPrice: 600 }],
		settings: { budgetMin: 1000, budgetMax: 500, hiddenStores: ['meesho', 3] }
	});
	assert.equal(d.wishlist.length, 1);
	assert.equal(d.wishlist[0].image, '');
	assert.equal(d.history.length, 30);
	assert.equal(d.alerts[0].startPrice, 600);
	assert.equal(d.settings.budgetMax, 1000);
	assert.deepEqual(d.settings.hiddenStores, ['meesho']);
	assert.deepEqual(normalizeData(null), emptyData());
});

test('alert reaches its target when a refreshed price drops below it', () => {
	const a: AlertItem = { id: 'p', name: 'P', image: '', query: '', target: 500, startPrice: 600, currentPrice: 600, storeName: '', createdAt: '', checkedAt: null, checks: 0, reached: false, reachedAt: null };
	const up = applyPrice(a, 620, '2026-01-01T00:00:00Z');
	assert.equal(up.reached, false);
	assert.equal(up.checks, 1);
	const down = applyPrice(up, 489, '2026-01-02T00:00:00Z');
	assert.equal(down.reached, true);
	assert.equal(down.reachedAt, '2026-01-02T00:00:00Z');
	assert.equal(applyPrice(down, 700).reached, true, 'stays reached');
	assert.equal(applyPrice(a, null).currentPrice, 600);
});

test('image sniffing + rate limiter', () => {
	assert.equal(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), 'image/jpeg');
	assert.equal(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0])), 'image/png');
	assert.equal(sniffImageType(new TextEncoder().encode('hello world!')), null);
	const rl = new RateLimiter(2, 1000);
	assert.equal(rl.check('ip', 0), 0);
	assert.equal(rl.check('ip', 1), 0);
	assert.ok(rl.check('ip', 2) > 0);
	assert.equal(rl.check('ip', 1001), 0);
});

test('colour classes + formatting', () => {
	assert.equal(classify(255, 107, 157), 'pink');
	assert.equal(classify(255, 255, 255), 'white');
	assert.equal(classify(28, 28, 28), 'black');
	assert.equal(classify(31, 78, 158), 'blue');
	assert.equal(classify(139, 90, 43), 'brown');
	assert.equal(inr(1299), '₹1,299');
	assert.equal(retailRound(1071), 1069);
});
