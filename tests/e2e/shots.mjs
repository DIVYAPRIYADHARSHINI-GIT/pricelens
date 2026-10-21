// Viewport (above-the-fold) screenshots for visual design review - no assertions.
//   BASE_URL=http://localhost:4417 node tests/e2e/shots.mjs
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, sleep } from './cdp.mjs';

const BASE = (process.env.BASE_URL ?? 'http://localhost:4417').replace(/\/$/, '');
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'output', 'design');
mkdirSync(OUT, { recursive: true });
const { newPage, close } = await launch({ port: 9541 });
const kill = setTimeout(() => (close(), process.exit(2)), 120_000);

const views = [
	['desktop', { width: 1440, height: 900, mobile: false }],
	['mobile', { width: 390, height: 844, mobile: true }]
];
for (const [vname, v] of views) {
	for (const theme of ['light', 'dark']) {
		const p = await newPage();
		await p.viewport(v.width, v.height, v.mobile);
		await p.addInitScript(`try { localStorage.setItem('pricelens.theme', '${theme}'); } catch (e) {}`);
		const go = async (path) => {
			await p.goto(BASE + path, { wait: 500 });
		};
		await go('/');
		await p.screenshot(join(OUT, `${vname}-${theme}-home.png`));
		await p.fill('[data-testid=text-input]', 'floral dress');
		await p.click('[data-testid=text-submit]');
		await p.waitFor("document.querySelector('[data-testid=best-card]')", 8000);
		await sleep(400);
		await p.screenshot(join(OUT, `${vname}-${theme}-results.png`));
		await go('/product/floral-summer-dress');
		await p.waitFor("document.querySelector('[data-testid=gallery]')", 8000);
		await sleep(400);
		await p.screenshot(join(OUT, `${vname}-${theme}-detail.png`));
		await p.eval("window.scrollTo(0, document.querySelector('[data-testid=compare-table]').getBoundingClientRect().top + scrollY - 140)");
		await sleep(300);
		await p.screenshot(join(OUT, `${vname}-${theme}-detail-2.png`));
		await p.click('[data-testid=detail-save]');
		await go('/saved');
		await p.screenshot(join(OUT, `${vname}-${theme}-saved.png`));
		await go('/settings');
		await p.screenshot(join(OUT, `${vname}-${theme}-settings.png`));
		await p.close();
	}
}
clearTimeout(kill);
await close();
console.log('shots in', OUT);
