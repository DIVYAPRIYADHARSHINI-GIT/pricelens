// End-to-end test with the locally installed headless Chrome (no npm deps).
//
//   npm run build && npx vite preview --port 4417 --strictPort &
//   caffeinate -dims env BASE_URL=http://localhost:4417 node tests/e2e/smoke.mjs
//
// Full flow: upload photo -> detect -> results -> sort/filter -> budget -> product
// detail -> wishlist -> price alert (+ Reached!) -> share (link / WhatsApp / copy
// comparison) -> history re-run/delete -> "Not sure" (blurry / unknown) -> error
// states (unsupported file, offline, camera denied) -> backup export/import ->
// start fresh, then every page on desktop + mobile (360px) + dark mode.
// Short timeouts, a freeze heartbeat and a global watchdog: fail fast, never hang.
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, sleep } from './cdp.mjs';

const BASE = (process.env.BASE_URL ?? 'http://localhost:4417').replace(/\/$/, '');
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'output', process.env.OUT_NAME ?? 'local');
const DL = join(OUT, 'downloads');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(DL, { recursive: true });
const SHOTS = process.env.SHOTS !== '0';
const PAGES = ['/', '/results', '/product/floral-summer-dress', '/saved', '/alerts', '/settings', '/does-not-exist'];

const results = [];
function check(name, ok, detail = '') {
	results.push({ name, ok: Boolean(ok), detail });
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const { newPage, close } = await launch({ port: Number(process.env.CDP_PORT ?? 9531) });
const WATCHDOG_MS = Number(process.env.E2E_TIMEOUT_MS ?? 5 * 60_000);
const watchdog = setTimeout(async () => {
	console.error(`E2E watchdog: aborting after ${WATCHDOG_MS / 1000}s`);
	await close().catch(() => {});
	process.exit(2);
}, WATCHDOG_MS);
watchdog.unref();

let seq = 0;
async function freshPage({ width = 1366, height = 900, mobile = false, dark = false, clear = true } = {}) {
	const p = await newPage();
	await p.viewport(width, height, mobile);
	const key = `pl-init-${++seq}`;
	await p.addInitScript(`
    try {
      if (!sessionStorage.getItem('${key}')) {
        ${clear ? 'localStorage.clear(); sessionStorage.clear();' : ''}
        sessionStorage.setItem('${key}', '1');
        localStorage.setItem('pricelens.theme', '${dark ? 'dark' : 'light'}');
      }
    } catch (e) {}
    window.__clip = '';
    try { Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (t) => { window.__clip = t; } }, configurable: true }); } catch (e) {}
    window.__opened = [];
    window.__beat = 0; setInterval(() => { window.__beat++; }, 50);
  `);
	await p.setDownloadDir(DL);
	return p;
}
async function notFrozen(p, label) {
	const a = await p.eval('window.__beat');
	await sleep(500);
	const b = await p.eval('window.__beat');
	check(`${label}: responsive (no freeze)`, b - a >= 5, `${b - a} beats/500ms`);
}
async function shot(p, name, fullPage = false) {
	if (SHOTS) await p.screenshot(join(OUT, `${name}.png`), { fullPage }).catch(() => {});
}
async function step(name, fn) {
	try {
		await fn();
	} catch (e) {
		check(name, false, String(e?.message ?? e).split('\n')[0]);
	}
}
const noErrors = (p, label) => check(`${label}: no console errors`, p.errors.length === 0, p.errors.slice(0, 2).join(' | '));
const overflow = (p) => p.eval('document.documentElement.scrollWidth - window.innerWidth');
const ready = (p) => p.waitFor("!document.querySelector('[data-testid=loading]') && document.querySelector('[data-testid=page-title]')", 8000);
const nav = async (p, path) => {
	await p.goto(BASE + path, { wait: 300 });
	await ready(p);
};
/** Client-side navigation via a real link (keeps in-memory search state). */
const clickNav = async (p, testid) => {
	const id = (await p.eval('innerWidth')) >= 900 ? `side-${testid}` : `tab-${testid}`;
	const href = await p.eval(`document.querySelector('[data-testid=${id}]')?.getAttribute('href')`);
	await p.click(`[data-testid=${id}]`);
	// Wait for the new route (over the network the old page title is still on screen for a moment).
	await p.waitFor(`location.pathname === ${JSON.stringify(href)} && document.querySelector('[data-testid=page-title]')`, 8000);
	await sleep(250);
	await ready(p);
};
const resultsReady = (p) => p.waitFor("document.querySelector('[data-testid=best-card]') || document.querySelector('[data-testid=not-sure]') || document.querySelector('[data-testid^=error-]')", 10000);

/** Draw a product-like photo in the page and attach it to the upload input. */
async function uploadDrawn(p, { bg = '#ffffff', fg = '#ff6b9d', name = 'IMG_2041.jpg', blur = false, type = 'image/jpeg' } = {}) {
	const ok = await p.eval(`(async () => {
    const c = document.createElement('canvas'); c.width = 1600; c.height = 1200;
    const x = c.getContext('2d');
    x.fillStyle = ${JSON.stringify(bg)}; x.fillRect(0, 0, 1600, 1200);
    x.fillStyle = ${JSON.stringify(fg)};
    x.beginPath(); x.moveTo(700, 200); x.lineTo(900, 200); x.lineTo(1100, 1000); x.lineTo(500, 1000); x.closePath(); x.fill();
    x.fillStyle = '#ffd60a'; for (let i = 0; i < 14; i++) { x.beginPath(); x.arc(640 + (i % 5) * 80, 450 + Math.floor(i / 5) * 160, 22, 0, 7); x.fill(); }
    x.strokeStyle = '#111'; x.lineWidth = 8; x.strokeRect(500, 200, 600, 800);
    let src = c;
    if (${blur}) { const t = document.createElement('canvas'); t.width = 40; t.height = 30; t.getContext('2d').drawImage(c, 0, 0, 40, 30); const u = document.createElement('canvas'); u.width = 1600; u.height = 1200; const ux = u.getContext('2d'); ux.imageSmoothingQuality = 'high'; ux.drawImage(t, 0, 0, 1600, 1200); src = u; }
    const blob = await new Promise((r) => src.toBlob(r, ${JSON.stringify(type)}, 0.9));
    const el = document.querySelector('[data-testid=file-input]'); if (!el) return false;
    const dt = new DataTransfer(); dt.items.add(new File([blob], ${JSON.stringify(name)}, { type: ${JSON.stringify(type)} }));
    el.files = dt.files; el.dispatchEvent(new Event('change', { bubbles: true })); return true;
  })()`);
	if (!ok) throw new Error('upload input not found');
}

/** Wait for a download whose name matches; returns { name, bytes }. */
async function waitDownload(re, timeout = 6000) {
	const start = Date.now();
	while (Date.now() - start < timeout) {
		const f = readdirSync(DL).find((n) => re.test(n) && !n.endsWith('.crdownload'));
		if (f) {
			const full = join(DL, f);
			await sleep(150);
			if (statSync(full).size > 0) return { name: f, bytes: readFileSync(full) };
		}
		await sleep(120);
	}
	throw new Error(`no download matching ${re}`);
}

// ---------------------------------------------------------------------------
// 1. Main flow (desktop, light)
// ---------------------------------------------------------------------------
const p = await freshPage();

await step('API health + limits', async () => {
	const h = await (await fetch(BASE + '/api/health')).json();
	check('API /api/health: demo mode', h.ok && h.mode === 'demo', JSON.stringify(h.limits));
	const r = await fetch(BASE + '/api/search', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}) });
	check('API /api/search: empty request -> 400', r.status === 400);
	const fd = new FormData();
	fd.append('image', new Blob(['not an image'], { type: 'text/plain' }), 'notes.txt');
	const u = await fetch(BASE + '/api/search', { method: 'POST', body: fd, headers: { origin: BASE } });
	check('API /api/search: unsupported type -> 415', u.status === 415);
	const big = new FormData();
	big.append('image', new Blob([new Uint8Array(2.2 * 1024 * 1024)], { type: 'image/jpeg' }), 'big.jpg');
	const b = await fetch(BASE + '/api/search', { method: 'POST', body: big, headers: { origin: BASE } });
	check('API /api/search: > 2 MB -> 413', b.status === 413);
});

await step('home screen', async () => {
	await nav(p, '/');
	check('home: tagline', /Snap\. Compare\. Save\./.test(await p.text('[data-testid=page-title]')));
	check('home: demo mode badge', (await p.count('[data-testid=demo-badge]')) >= 1);
	check('home: camera input opens rear camera', (await p.eval(`(() => { const i = document.querySelector('[data-testid=camera-input]'); return i.accept === 'image/*' && i.getAttribute('capture') === 'environment'; })()`)));
	check('home: upload + drag-and-drop zone + text search', (await p.count('[data-testid=upload-photo]')) === 1 && (await p.count('[data-testid=dropzone]')) === 1 && (await p.count('[data-testid=text-input]')) === 1);
	check('home: 5 sample photos', (await p.count('[data-testid^=sample-]')) === 6);
	await shot(p, 'd-home', true);
	noErrors(p, 'home');
});

await step('upload photo -> detect -> results', async () => {
	await uploadDrawn(p, { bg: '#fff3b0', fg: '#ff6b9d' });
	// loading state with a friendly message + preview
	await p.waitFor("document.querySelector('[data-testid=search-loading]') || document.querySelector('[data-testid=best-card]')", 5000);
	await resultsReady(p);
	const title = await p.text('[data-testid=page-title]');
	check('detect: pink photo -> floral dress', /Floral/.test(title ?? ''), title);
	check('results: scanned image shown in top card', (await p.eval("document.querySelector('[data-testid=detected-card] img')?.src.startsWith('data:image/jpeg')")) === true);
	const pv = await p.eval(`(async () => { const s = document.querySelector('[data-testid=detected-card] img'); const i = new Image(); i.src = s.src; await i.decode(); return Math.max(i.naturalWidth, i.naturalHeight); })()`);
	check('upload: resized to max 1024px in browser', pv === 1024, `${pv}px`);
	check('results: best price card is the cheapest (Meesho ₹549)', /549/.test(await p.text('[data-testid=best-price]')) && (await p.eval("document.querySelector('[data-testid=best-card]').dataset.store")) === 'meesho');
	check('results: "Cheapest ✓" stamp', /Cheapest ✓/.test(await p.text('[data-testid=best-card]')));
	check('results: best Buy opens store in new tab', (await p.eval("(() => { const a = document.querySelector('[data-testid=best-buy]'); return a.target === '_blank' && a.rel.includes('noopener') && a.href.startsWith('https://www.meesho.com'); })()")));
	check('results: 5 other stores listed', (await p.count('[data-testid=listing]')) === 5);
	const labels = await p.eval("[...document.querySelectorAll('[data-testid=listing]')].map((l) => l.dataset.label)");
	check('results: price labels (good deal / above average)', labels.includes('good') && labels.includes('above'), labels.join(','));
	check('results: best card label "Lowest price"', /Lowest price/.test(await p.text('[data-testid=best-card] [data-testid=price-label]')));
	check('results: indicative-price note', /Prices are indicative and may change/.test(await p.text('[data-testid=indicative-note]')));
	check('results: similar styles carousel', (await p.count('[data-testid=similar] [data-testid=suggestion]')) >= 3);
	check('results: cheaper alternatives show savings', (await p.count('[data-testid=cheaper] [data-testid=saving]')) >= 3 && /You save ₹/.test(await p.text('[data-testid=cheaper] [data-testid=saving]')));
	await shot(p, 'd-results', true);
	noErrors(p, 'results');
	await notFrozen(p, 'results');
});

await step('sort + filter', async () => {
	const prices = () => p.eval("[...document.querySelectorAll('[data-testid=listing]')].map((l) => Number(l.dataset.price))");
	const ps = await prices();
	check('sort: lowest price first by default', ps.every((v, i) => i === 0 || ps[i - 1] <= v), ps.join(','));
	await p.click('[data-testid=sort-rating]');
	const ratings = await p.eval("[...document.querySelectorAll('[data-testid=listing] .stars b')].map((b) => Number(b.textContent))");
	check('sort: highest rated', ratings.every((v, i) => i === 0 || ratings[i - 1] >= v), ratings.join(','));
	await p.click('[data-testid=sort-delivery]');
	const first = await p.eval("document.querySelector('[data-testid=listing]').dataset.store");
	check('sort: fastest delivery (Amazon, 2 days)', first === 'amazon', first);
	await p.click('[data-testid=sort-price]');
	await p.click('[data-testid=f-store-myntra]');
	await p.click('[data-testid=f-store-ajio]');
	const stores = await p.eval("[document.querySelector('[data-testid=best-card]').dataset.store, ...[...document.querySelectorAll('[data-testid=listing]')].map((l) => l.dataset.store)]");
	check('filter: by store', stores.length === 2 && stores.includes('myntra') && stores.includes('ajio'), stores.join(','));
	await p.click('[data-testid=f-reset]');
	await p.fill('[data-testid=f-max]', '900');
	const maxed = await p.eval("[...document.querySelectorAll('[data-testid=listing]')].map((l) => Number(l.dataset.price))");
	check('filter: price range slider', maxed.every((v) => v <= 900) && maxed.length === 2, maxed.join(','));
	await p.click('[data-testid=f-reset]');
	await p.click('[data-testid=f-rating-4_2]').catch(() => {});
	await p.click('[data-testid=f-rating-4]');
	const rated = await p.eval("[...document.querySelectorAll('[data-testid=listing] .stars b')].map((b) => Number(b.textContent))");
	check('filter: minimum rating 4★', rated.every((r) => r >= 4), rated.join(','));
	await p.click('[data-testid=f-reset]');
	await p.clickText('[data-testid=f-brand]', 'SunKissed');
	const brandCount = 1 + (await p.count('[data-testid=listing]'));
	check('filter: brand', brandCount === 2, `${brandCount}`);
	await p.click('[data-testid=f-reset]');
	check('filter: reset restores all 6', 1 + (await p.count('[data-testid=listing]')) === 6);
});

await step('edit detected product', async () => {
	await p.click('[data-testid=edit-detected]');
	check('edit: category chips (8) + text box', (await p.count('[data-testid=edit-search] [data-testid^=cat-]')) === 8 && (await p.count('[data-testid=edit-query]')) === 1);
	await p.click('[data-testid=cat-shoes]');
	await p.click('[data-testid=edit-submit]');
	await p.waitFor("/Sneakers/.test(document.querySelector('[data-testid=page-title]')?.textContent ?? '')", 6000);
	check('edit: corrected to shoes -> sneakers result', true);
	check('edit: keeps the scanned photo', (await p.eval("document.querySelector('[data-testid=detected-card] img')?.src.startsWith('data:image/jpeg')")) === true);
});

await step('budget dims + hides results', async () => {
	await clickNav(p, 'settings');
	await p.fill('[data-testid=budget-max]', '1000');
	await p.click('[data-testid=budget-save]');
	check('settings: budget saved', (await p.eval("JSON.parse(localStorage.getItem('pricelens.v1')).settings.budgetMax")) === 1000);
	await p.click('[data-testid=store-toggle-tatacliq]');
	check('settings: store hidden', (await p.eval("JSON.parse(localStorage.getItem('pricelens.v1')).settings.hiddenStores")).includes('tatacliq'));
	await clickNav(p, 'results');
	await resultsReady(p);
	check('budget: over-budget listings dimmed', (await p.count('[data-testid=listing].dim')) >= 2 && (await p.count('[data-testid=over-budget]')) >= 2);
	check('stores: hidden store removed from results', (await p.count('[data-testid=listing][data-store=tatacliq]')) === 0);
	await p.click('[data-testid=hide-over-budget]');
	const ps = await p.eval("[...document.querySelectorAll('[data-testid=listing]')].map((l) => Number(l.dataset.price))");
	check('budget: toggle hides over-budget results', ps.every((v) => v <= 1000) && (await p.count('[data-testid=listing].dim')) === 0, ps.join(','));
	await shot(p, 'd-results-budget', true);
	await p.click('[data-testid=hide-over-budget]');
});

await step('product detail', async () => {
	await p.click('[data-testid=open-detail]');
	await p.waitFor("document.querySelector('[data-testid=gallery]')", 8000);
	check('detail: image gallery (4)', (await p.count('[data-testid=gallery-thumb]')) === 4);
	const src1 = await p.eval("document.querySelector('[data-testid=gallery-main]').src");
	await p.eval("document.querySelectorAll('[data-testid=gallery-thumb]')[2].click()");
	await sleep(150);
	check('detail: gallery switches image', (await p.eval("document.querySelector('[data-testid=gallery-main]').src")) !== src1);
	check('detail: comparison table', (await p.count('[data-testid=compare-row]')) >= 4);
	check('detail: price history SVG chart', (await p.count('[data-testid=price-chart] svg path')) >= 2 && (await p.count('[data-testid=price-chart] circle')) >= 10);
	check('detail: size + colour options', (await p.count('[data-testid=size-option]')) >= 4 && (await p.count('[data-testid=colour-option]')) >= 2);
	await p.eval("document.querySelectorAll('[data-testid=size-option]')[2].click()");
	await sleep(80);
	check('detail: size selectable', (await p.eval("document.querySelectorAll('[data-testid=size-option]')[2].getAttribute('aria-pressed')")) === 'true');
	check('detail: all images have alt text', (await p.eval("[...document.images].every((i) => i.hasAttribute('alt'))")) === true);
	noErrors(p, 'detail');
});

await step('wishlist', async () => {
	await p.click('[data-testid=detail-save]');
	check('wishlist: saved from detail', (await p.eval("JSON.parse(localStorage.getItem('pricelens.v1')).wishlist.length")) === 1);
	const wl = await p.eval("JSON.parse(localStorage.getItem('pricelens.v1')).wishlist[0]");
	check('wishlist: best price at time of saving', wl.price === 649 && wl.storeName === 'Meesho', `${wl.price} ${wl.storeName}`);
});

await step('price alert', async () => {
	await p.click('[data-testid=set-alert]');
	await p.waitFor("document.querySelector('[data-testid=alert-form]')", 3000);
	check('alert: backend note shown', /need a backend/.test(await p.text('[data-testid=alert-form]')));
	await p.fill('[data-testid=alert-target]', '0');
	await p.click('[data-testid=alert-save]');
	check('alert: rejects ₹0 target', (await p.count('[data-testid=alert-form] [role=alert]')) === 1);
	await p.fill('[data-testid=alert-target]', '600');
	await p.click('[data-testid=alert-save]');
	check('alert: saved locally', (await p.eval("JSON.parse(localStorage.getItem('pricelens.v1')).alerts[0].target")) === 600);
	check('alert: target line on chart', (await p.count('[data-testid=price-chart] line.target')) === 1);
	await shot(p, 'd-detail', true);
});

await step('share', async () => {
	await p.click('[data-testid=share-link]');
	const clip = await p.eval('window.__clip');
	check('share: copies product link', /\/product\/white-sneakers$/.test(clip), clip);
	const wa = await p.eval("document.querySelector('[data-testid=share-whatsapp]').href");
	const msg = decodeURIComponent(wa.split('text=')[1] ?? '');
	check('share: WhatsApp pre-filled (name, best price, link)', wa.startsWith('https://wa.me/?text=') && /Classic White Low-Top Sneakers/.test(msg) && /₹/.test(msg) && /\/product\/white-sneakers/.test(msg), msg);
	await p.click('[data-testid=copy-comparison]');
	const cmp = await p.eval('window.__clip');
	check('share: copy comparison (store, price, link list)', /^PriceLens comparison/.test(cmp) && /1\. Meesho - ₹649 \(57% off\) - https:\/\/www\.meesho\.com/.test(cmp) && cmp.split('\n').filter((l) => /^\d+\. /.test(l)).length >= 4, cmp.split('\n')[1]);
});

await step('alerts page + Reached!', async () => {
	await clickNav(p, 'alerts');
	check('alerts: listed', (await p.count('[data-testid=alert-item]')) === 1);
	check('alerts: not reached yet', (await p.count('[data-testid=reached-badge]')) === 0);
	let reached = false;
	for (let i = 0; i < 8 && !reached; i++) {
		await p.click('[data-testid=refresh-alerts]');
		await p.waitFor("!document.querySelector('[data-testid=refresh-alerts]')?.disabled", 6000);
		reached = (await p.count('[data-testid=reached-badge]')) === 1;
	}
	check('alerts: "Reached!" badge after a refreshed price drops below target', reached, await p.text('[data-testid=alert-current]'));
	check('alerts: tab badge counts reached alerts', /1/.test((await p.text('[data-testid=side-alerts] .count')) ?? ''));
	await shot(p, 'd-alerts', true);
	noErrors(p, 'alerts');
});

await step('saved + history', async () => {
	await clickNav(p, 'saved');
	check('saved: wishlist card', (await p.count('[data-testid=wish-card]')) === 1);
	check('history: scans recorded with thumbnails', (await p.count('[data-testid=history-item]')) >= 2 && (await p.count('[data-testid=history-item] img')) >= 1);
	await shot(p, 'd-saved', true);
	const before = await p.count('[data-testid=history-item]');
	await p.eval("document.querySelectorAll('[data-testid=history-delete]')[0].click()");
	await sleep(150);
	check('history: delete one', (await p.count('[data-testid=history-item]')) === before - 1);
	await p.eval("document.querySelectorAll('[data-testid=history-rerun]')[0].click()");
	await p.waitFor("location.pathname === '/results'", 3000);
	await resultsReady(p);
	check('history: re-run opens results', (await p.count('[data-testid=best-card]')) === 1, await p.text('[data-testid=page-title]'));
	await clickNav(p, 'saved');
	await p.click('[data-testid=wish-remove]');
	check('wishlist: remove', (await p.count('[data-testid=wish-card]')) === 0 && (await p.count('[data-testid=wishlist-empty]')) === 1);
});

await step('text search + not sure + no results', async () => {
	await nav(p, '/');
	await p.fill('[data-testid=text-input]', 'wireless earbuds');
	await p.click('[data-testid=text-submit]');
	await resultsReady(p);
	check('text search: earbuds', /Earbuds/.test(await p.text('[data-testid=page-title]')));
	await nav(p, '/');
	await p.fill('[data-testid=text-input]', 'gaming laptop');
	await p.click('[data-testid=text-submit]');
	await resultsReady(p);
	check('text search: unknown -> no-results / Not sure screen', (await p.count('[data-testid=not-sure]')) === 1 && /No results/.test(await p.text('[data-testid=not-sure]')));
	await p.click('[data-testid=cat-phone]');
	await p.click('[data-testid=edit-submit]');
	await resultsReady(p);
	check('category without demo data stays on Not sure', (await p.count('[data-testid=not-sure]')) === 1);
	await nav(p, '/');
	await p.click('[data-testid=sample-blurry]');
	await resultsReady(p);
	check('blurry photo -> "Not sure what this is?"', (await p.count('[data-testid=not-sure]')) === 1 && /Blurry/.test(await p.text('[data-testid=not-sure]')));
	check('not sure: 8 category chips + text box', (await p.count('[data-testid=not-sure] [data-testid^=cat-]')) === 8 && (await p.count('[data-testid=not-sure] [data-testid=edit-query]')) === 1);
	await shot(p, 'd-not-sure', true);
	await p.click('[data-testid=cat-dress]');
	await p.click('[data-testid=edit-submit]');
	await p.waitFor("document.querySelector('[data-testid=best-card]')", 8000);
	check('not sure: picking Dress finds the dress', /Floral/.test(await p.text('[data-testid=page-title]')));
	for (const k of ['sneakers', 'backpack', 'earbuds', 'watch']) {
		await nav(p, '/');
		await p.click(`[data-testid=sample-${k}]`);
		await resultsReady(p);
		const t = await p.text('[data-testid=page-title]');
		const want = { sneakers: /Sneakers/, backpack: /Backpack/, earbuds: /Earbuds/, watch: /Watch/ }[k];
		check(`sample photo: ${k} detected by colour`, want.test(t ?? ''), t);
	}
});

await step('error states', async () => {
	await nav(p, '/');
	await p.setFile('[data-testid=file-input]', 'notes.txt', 'hello', 'text/plain');
	await resultsReady(p);
	check('error: unsupported file', (await p.count('[data-testid=error-unsupported]')) === 1);
	await shot(p, 'd-error-unsupported');
	await nav(p, '/');
	await p.eval("(() => { Object.defineProperty(navigator, 'onLine', { value: false, configurable: true }); window.dispatchEvent(new Event('offline')); return 1; })()");
	await sleep(100);
	check('offline: banner shown', (await p.count('[data-testid=offline-banner]')) === 1);
	await p.fill('[data-testid=text-input]', 'watch');
	await p.click('[data-testid=text-submit]');
	await resultsReady(p);
	check('error: no internet', (await p.count('[data-testid=error-offline]')) === 1);
	await shot(p, 'd-error-offline');
	await p.eval("(() => { Object.defineProperty(navigator, 'onLine', { value: true, configurable: true }); window.dispatchEvent(new Event('online')); return 1; })()");
	await p.click('[data-testid=retry]');
	await resultsReady(p);
	check('offline: retry works once back online', (await p.count('[data-testid=best-card]')) === 1);
	await nav(p, '/');
	await p.eval("(() => { navigator.permissions.query = async () => ({ state: 'denied' }); return 1; })()");
	await p.click('[data-testid=scan-camera]');
	await p.waitFor("document.querySelector('[data-testid=camera-denied]')", 3000);
	check('error: camera permission denied', true);
	await shot(p, 'd-camera-denied');
	await nav(p, '/product/does-not-exist');
	await p.waitFor("document.querySelector('[data-testid=detail-missing]')", 6000);
	check('detail: unknown product -> not found', true);
	await nav(p, '/nope');
	check('404 page', (await p.count('[data-testid=error-page]')) === 1);
});

await step('backup export/import + start fresh', async () => {
	await nav(p, '/settings');
	check('settings: privacy note (never stored on server)', /never stored on our server/.test(await p.text('[data-testid=privacy-note]')));
	await p.click('[data-testid=export-backup]');
	const dl = await waitDownload(/^pricelens-backup-.*\.json$/);
	const data = JSON.parse(dl.bytes.toString('utf8'));
	check('backup: JSON export', data.app === 'PriceLens' && Array.isArray(data.history) && data.alerts.length === 1, dl.name);
	await p.click('[data-testid=start-fresh]');
	await p.waitFor("document.querySelector('[data-testid=confirm-dialog]')?.open", 3000);
	await p.click('[data-testid=confirm-ok]');
	const st = await p.eval("JSON.parse(localStorage.getItem('pricelens.v1'))");
	check('start fresh: clears history, wishlist, alerts', st.history.length === 0 && st.wishlist.length === 0 && st.alerts.length === 0);
	check('start fresh: keeps budget settings', st.settings.budgetMax === 1000);
	await p.setFile('[data-testid=import-input]', 'backup.json', dl.bytes.toString('utf8'), 'application/json');
	await p.waitFor("document.querySelector('[data-testid=confirm-dialog]')?.open", 3000);
	await p.click('[data-testid=confirm-ok]');
	await sleep(200);
	const st2 = await p.eval("JSON.parse(localStorage.getItem('pricelens.v1'))");
	check('backup: import restores data', st2.alerts.length === 1 && st2.history.length === data.history.length);
	await p.setFile('[data-testid=import-input]', 'bad.json', '{ nope', 'application/json');
	await sleep(300);
	check('backup: bad JSON rejected', /valid JSON/.test(await p.eval("[...document.querySelectorAll('[data-testid=toast]')].map((t) => t.innerText).join(' | ')")) && (await p.count('[data-testid=confirm-dialog][open]')) === 0);
	// reset budget so it doesn't affect later checks
	await p.click('[data-testid=start-fresh]');
	await p.waitFor("document.querySelector('[data-testid=confirm-dialog]')?.open", 3000);
	await p.click('[data-testid=confirm-ok]');
	await shot(p, 'd-settings', true);
	noErrors(p, 'settings');
});

await step('keyboard + accessibility basics', async () => {
	await nav(p, '/');
	const small = await p.eval(`[...document.querySelectorAll('button, a.btn, .chip, .tab, .side-link, input[type=checkbox]')].filter((e) => e.offsetParent && (e.getBoundingClientRect().height < 44 || e.getBoundingClientRect().width < 44) && !e.classList.contains('tag')).map((e) => e.dataset.testid || e.textContent.trim().slice(0, 20))`);
	check('a11y: tap targets >= 44px', small.length === 0, small.slice(0, 5).join(', '));
	check('a11y: all images have alt', (await p.eval("[...document.images].every((i) => i.hasAttribute('alt'))")) === true);
	await p.eval("document.querySelector('[data-testid=scan-camera]').focus()");
	const outline = await p.eval("getComputedStyle(document.activeElement).outlineStyle");
	check('a11y: visible focus state', outline !== 'none', outline);
});
await p.close();

// ---------------------------------------------------------------------------
// 2. Every page on desktop / mobile 360px / tablet, light + dark
// ---------------------------------------------------------------------------
for (const [label, opts] of [
	['desktop-dark', { width: 1366, height: 900, dark: true }],
	['mobile', { width: 360, height: 780, mobile: true }],
	['mobile-dark', { width: 360, height: 780, mobile: true, dark: true }],
	['tablet', { width: 820, height: 1180, mobile: true }]
]) {
	await step(`${label}: all pages`, async () => {
		const q = await freshPage(opts);
		await nav(q, '/');
		// seed one result so /results has content
		await q.fill('[data-testid=text-input]', 'floral dress');
		await q.click('[data-testid=text-submit]');
		await resultsReady(q);
		for (const path of PAGES) {
			if (path === '/results') {
				await clickNav(q, 'results').catch(() => {});
			} else await nav(q, path);
			await sleep(200);
			const name = path === '/' ? 'home' : path.replaceAll('/', '-').slice(1);
			const ov = await overflow(q);
			check(`${label} ${path}: no horizontal overflow`, ov <= 1, `${ov}px`);
			await shot(q, `${label}-${name}`, path !== '/does-not-exist');
		}
		if (opts.mobile && opts.width < 900) {
			check(`${label}: bottom tab bar with 5 tabs`, (await q.count('[data-testid=tabbar] a')) === 5);
			const tb = await q.eval("(() => { const r = document.querySelector('[data-testid=tabbar]').getBoundingClientRect(); return r.bottom >= innerHeight - 2 && r.top > innerHeight / 2; })()");
			check(`${label}: tab bar pinned to the bottom (thumb zone)`, tb);
			await nav(q, '/');
			const cam = await q.eval("document.querySelector('[data-testid=scan-camera]').getBoundingClientRect().height");
			check(`${label}: big scan button`, cam >= 60, `${cam}px`);
		} else if (opts.width >= 900) {
			check(`${label}: sidebar visible`, await q.eval("getComputedStyle(document.querySelector('[data-testid=sidebar]')).display !== 'none'"));
		}
		if (opts.dark) check(`${label}: dark theme applied`, (await q.eval('document.documentElement.dataset.theme')) === 'dark' && (await q.eval("getComputedStyle(document.body).backgroundColor")) === 'rgb(10, 10, 10)');
		noErrors(q, label);
		await notFrozen(q, label);
		await q.close();
	});
}

// Dark-mode toggle from the UI
await step('dark mode toggle', async () => {
	const q = await freshPage();
	await nav(q, '/');
	await q.click('[data-testid=theme-toggle]');
	check('theme toggle: switches to dark + persists', (await q.eval('document.documentElement.dataset.theme')) === 'dark' && (await q.eval("localStorage.getItem('pricelens.theme')")) === 'dark');
	await q.close();
});

clearTimeout(watchdog);
await close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed${failed.length ? `, ${failed.length} failed` : ''}. Screenshots: ${OUT}`);
process.exit(failed.length ? 1 : 0);
