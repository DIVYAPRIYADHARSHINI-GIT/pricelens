import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Server routes (/api/search, /api/product, /api/prices, /api/health) run as
		// Vercel Node.js serverless functions so provider API keys stay on the server.
		// Pages are client-rendered (wishlist/history/alerts live in localStorage).
		// Runtime pinned explicitly (the adapter refuses to infer one from newer local Node versions).
		adapter: adapter({ runtime: 'nodejs22.x' })
	}
};

export default config;
