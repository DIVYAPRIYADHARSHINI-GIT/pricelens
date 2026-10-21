# PriceLens - Snap. Compare. Save.

PriceLens is a visual shopping search tool for budget shoppers. Take a photo of a product (a dress, say) or upload one, and PriceLens shows which stores sell it, **cheapest first**, plus similar styles and cheaper alternatives.

It runs in **demo mode** out of the box. Everything works with built-in sample data and **no API keys**, so you can demo and deploy it straight away. Live APIs are optional and controlled only by server-side environment variables.

## Live demo

- **Live site:** https://pricelens-pied.vercel.app (demo mode, try the sample photos or snap anything)
- **Source:** https://github.com/DIVYAPRIYADHARSHINI-GIT/pricelens
- **Hosting:** Vercel Hobby (free plan), connected to this GitHub repo, so every push to `main` auto-deploys to production.
- **Tested:** 17 unit tests and a 143-check headless-Chrome end-to-end suite, passing both locally and against the live site.

## Features

**Scan / search**
- A big **Scan with camera** button (`<input type="file" accept="image/*" capture="environment">` opens the phone's rear camera), an **Upload photo** button, and drag-and-drop on desktop.
- Photos are resized in the browser (max 1024 px) and compressed to JPEG before upload. You get a preview and a loading state with friendly rotating messages.
- **"Not sure what this is?"** screen for blurry, uncertain or empty photos and unknown searches. It has category chips (Dress, Shirt, Shoes, Bag, Watch, Phone, Headphones, Other) and a text box to correct the search.
- Plain text search ("or type what you're looking for"), quick category chips, and 5 sample photos plus a blurry one so the demo works without a camera.

**Results**
- Top card: your scanned image, detected product name, category, match %, dominant colour, and an **Edit** button.
- Green **Best price** card with a "Cheapest ✓" stamp. It shows the store badge, rating, delivery, discount %, savings and a **Buy** button that opens the store in a new tab.
- Other stores (Amazon, Flipkart, Myntra, Meesho, Ajio, Nykaa Fashion, Tata CLiQ, Croma) with price, MRP, discount, rating, delivery time and Buy.
- Colour-coded sticker labels: **Lowest price**, **Good deal** (at or below average), **Above average**.
- **Sort**: lowest price, highest rated, fastest delivery. **Filter**: store, price-range sliders, minimum rating, brand.
- **Similar styles** and **Cheaper alternatives** carousels. Cheaper alternatives show "You save ₹…".
- Note: "Prices are indicative and may change on the store's site."

**Product detail** (`/product/[id]`)
- Image gallery, price comparison table, a 13-week price history as a plain SVG line chart (alert target drawn as a dashed line), and size and colour options.
- **Set price alert**, saved locally, with a note that email or push alerts need a backend.

**Saved and history**
- Wishlist cards showing the best price when you saved them. History of recent scans with thumbnails; re-run or delete each one, or clear all.
- Price alerts list: **Refresh prices** re-checks prices through `/api/prices`, and a **Reached!** badge appears once a refreshed price drops to or below the target. The Alerts tab shows a count.

**Stores and budget**
- **My budget** (min and max): results outside it are dimmed, and a toggle hides them completely.
- Per-store toggles to hide stores you don't want.

**Share**
- **Share result** copies a link. **Share on WhatsApp** pre-fills the product name, best price and link. **Copy comparison** copies the store / price / link list as plain text. The native share sheet is offered where available.

**Settings and data**
- JSON backup export and import (validated before anything changes), and **Start fresh**, which clears history, wishlist and alerts but keeps budget and store settings.
- Dark mode (near-black background, bone-white type, softened accents). It follows the system on first visit and is remembered after that.
- Privacy note: photos are processed in memory and **never stored on the server**.

**Design and accessibility: "Maison" editorial style**
- Inspired by fashion e-commerce sites (Zara, COS, SSENSE, Arket):
  - **Palette:** monochrome ink `#111` on warm paper `#F7F5F0`, hairline `#DCD6CC` rules and a stone surface. Colour appears only where it means something: oxblood `#9B2C2C` for discounts and warnings, a sage sticker for "Good deal", clay for "Above average", and a black sticker for "Lowest price".
  - **Type:** headlines, prices and the wordmark use the Didone serif **Bodoni Moda**. UI, labels and numbers use the geometric sans **Jost**, with uppercase letter-spaced micro-labels and tabular figures for prices.
  - **Shapes:** square corners everywhere, 1 px borders, no drop shadows, and generous white space.
- **Desktop layout:** a black announcement strip, then a sticky header with uppercase nav links on the left, the serif wordmark in the centre and the Demo-mode badge and theme toggle on the right. A serif wordmark footer closes each page.
- **Mobile layout:** a slim top bar and a hairline bottom tab bar (Scan, Results, Saved, Alerts, Settings) in the thumb zone.
- **Product imagery:** placeholder "studio shots" are generated SVGs in portrait 3:4, with muted backdrops, a soft floor shadow and fine-line silhouettes. Product cells show the brand in caps, the name, then the price.
  - The product page has a vertical thumbnail rail, a large portrait image with an image counter, a sticky summary column, square size selectors, colour swatches and a full-width black Buy button.
  - The "Best price" card is an ink-black block (it inverts in dark mode) with a round serif-italic "Cheapest ✓" seal.
- Fine-line custom SVG icons, a slow image zoom and an underline-slide on hover (off under `prefers-reduced-motion`), loading skeletons, and empty / no-result / error states: no internet, blurry photo, camera permission denied, unsupported or too-large file, rate limited, and 404.
- Tap targets of at least 44 px, alt text on all images, keyboard-friendly controls and visible focus rings. Every text colour pair meets WCAG AA: muted text is 5.6:1 in light mode and 7.4:1 in dark mode.

## Tech stack

- **SvelteKit 2 + Svelte 5 + TypeScript**, deployed on **Vercel** with `@sveltejs/adapter-vercel` (Node.js 22 functions).
- Server routes keep provider logic and keys on the server:
  - `POST /api/search`: photo (multipart `image` + `meta` JSON) or text/category (JSON)
  - `GET /api/product/:id`: product, listings, gallery, price history and suggestions
  - `POST /api/prices`: refreshed best prices for alerts
  - `GET /api/health`: demo or live mode and upload limits (never exposes keys)
- No chart library (hand-written SVG), no database. Wishlist, history, alerts and settings live in `localStorage`, with JSON backup.
- Fonts: `@fontsource/bodoni-moda` and `@fontsource/jost`, self-hosted (no Google Fonts requests).
- The only dependencies are dev dependencies: SvelteKit, Vite, the adapter, svelte-check and the fonts.

### Provider interface

```
src/lib/server/providers/
  types.ts   Provider interface: search(), product(), prices()
  mock.ts    MockProvider (default): dominant-colour + filename/text matcher -> sample listings
  real.ts    RealProvider (optional): Google Cloud Vision Web Detection + SerpAPI Google Shopping
  index.ts   providerFromEnv(): picks the provider from environment variables
```

**MockProvider.** The browser computes simple image features while resizing: a palette with the background removed, product coverage, and sharpness (Laplacian variance). No extra pixels leave the device for this. The server scores the palette against each of the 5 sample categories.
- Low sharpness → "Blurry photo".
- Low margin between the top two categories → "Not sure" with a best guess.
- Text queries and the category picker always work as fallbacks.

**Sample data.** 5 categories: a floral summer dress, white sneakers, a backpack, wireless earbuds and a wrist watch.
- Each has 5 or 6 store listings, 4 similar styles and 3 cheaper alternatives.
- Prices run from about ₹299 to ₹2,999, with ratings, review counts, delivery times and discounts.
- Images are generated flat SVG tiles (`src/lib/art.ts`), not product photos.
- Store "logos" are coloured initial badges, not trademarks.
- Buy links go to each store's real search page for that product title.

### Limits and safety

- Images: max **2 MB** after in-browser compression (the browser rejects inputs over 25 MB). Accepted types are JPG, PNG and WebP, checked by MIME type **and** magic bytes.
- Rate limit: **60 requests per minute per IP** on `/api/search` and `/api/prices` (in-memory, per instance; change it with `RATE_LIMIT_PER_MIN`). Over the limit you get a friendly 429.
- Uploaded image bytes are only read in memory, forwarded to Vision when live mode is on, then dropped. Nothing is written to disk.
- SvelteKit's CSRF protection rejects cross-site form posts.
- Every fetch has a timeout (15 s for search, 10 s for prices, 9 s for upstream APIs). There are no `$effect`s that write state they depend on, so there are no reactive loops.

## Setup

Requirements: Node.js 22.12 or newer, and npm.

```bash
cd pricelens
npm install
npm run dev          # http://localhost:5173 (demo mode, no keys needed)
```

Other scripts:

```bash
npm run check        # svelte-check (TypeScript + Svelte)
npm test             # unit tests (node:test, no extra deps)
npm run build        # production build (Vercel adapter)
npm run preview      # serve the production build locally

# End-to-end test with your installed Google Chrome (headless, no extra deps):
npx vite preview --port 4417 --strictPort &
caffeinate -dims env BASE_URL=http://localhost:4417 node tests/e2e/smoke.mjs
```

The e2e test covers the full flow: upload → detect → results → sort/filter → budget → product detail → wishlist → alert (Reached!) → share → history → "Not sure" → error states → backup → start fresh. It then checks every page on desktop, mobile (360 px) and tablet in light and dark mode. It uses short timeouts, a freeze heartbeat and a global watchdog, and saves screenshots in `tests/e2e/output/`.

## Switching from demo mode to real APIs

Demo mode is the default. Live mode turns on **only** when both of these are set on the server:

| Variable | Required | What it does |
| --- | --- | --- |
| `PRICELENS_PROVIDER` | yes, set to `real` | Turns on the RealProvider. Any other value means demo mode. |
| `SERPAPI_API_KEY` | yes | Prices and store listings from the [SerpAPI Google Shopping API](https://serpapi.com/google-shopping-api), cheapest first. |
| `GOOGLE_VISION_API_KEY` | optional | Photo detection with [Google Cloud Vision](https://cloud.google.com/vision/docs/detecting-web) `WEB_DETECTION` (best-guess label + web entities) and `LABEL_DETECTION`. Without it, photos use the demo colour matcher to guess a category, which is then searched live. |
| `PRICELENS_COUNTRY` / `PRICELENS_LANGUAGE` | optional | Google Shopping `gl` / `hl` (default `in` / `en`). |
| `RATE_LIMIT_PER_MIN` | optional | Requests per minute per IP (default 60). |

Steps:

1. Copy `.env.example` to `.env` for local use, or add the variables in **Vercel → Project → Settings → Environment Variables**.
2. Set `PRICELENS_PROVIDER=real` and `SERPAPI_API_KEY=...`, plus `GOOGLE_VISION_API_KEY=...` if you want real photo detection.
3. Redeploy, or restart `npm run dev`. The "Demo mode" badge changes to "Live".

**Never commit keys.** `.env*` is git-ignored (except `.env.example`), keys are read only through `$env/dynamic/private` on the server, and `/api/health` reports only `demo` or `live`. To use an affiliate or other product-search API instead, add a provider that implements `Provider` in `src/lib/server/providers/` and select it in `providerFromEnv()`.

How live results behave:
- The cheapest 8 offers become the comparison.
- Further results become the "similar" and "cheaper" suggestions.
- Live products are cached in the browser session for the detail page.
- Alerts on live products re-query the shopping API when refreshed.

## Project structure

```
pricelens/
  src/
    app.html, app.css, hooks.client.ts
    lib/
      types.ts, pricing.ts, format.ts, colour.ts, stores.ts, art.ts, samples.ts
      client/   image.ts (resize/compress/features), search.svelte.ts, store.svelte.ts, ui.svelte.ts, backup.ts
      server/   catalog.ts (sample data), api.ts, limits.ts, providers/
      components/  Nav, ResultsView, BestPriceCard, ListingRow, FilterPanel, Carousel, PriceChart, ShareBar, ...
    routes/
      +page.svelte (Scan), results/, product/[id]/, saved/, alerts/, settings/, +error.svelte
      api/search, api/product/[id], api/prices, api/health
  tests/unit/  pricing, provider/catalog, data/backup/limits
  tests/e2e/   cdp.mjs (tiny Chrome DevTools driver), smoke.mjs
```

## Privacy

Photos are resized and compressed on your device, sent once to `/api/search`, processed in memory and **never stored on the server**. Wishlist, history, alerts and settings stay in your browser's localStorage. There are no accounts and no database.

## License

MIT
