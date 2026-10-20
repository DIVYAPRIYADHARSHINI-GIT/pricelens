// Provider selection. Demo mode (MockProvider) unless PRICELENS_PROVIDER=real AND
// SERPAPI_API_KEY is set. Keys are read from the server environment only.
import { MockProvider } from './mock.ts';
import { RealProvider } from './real.ts';
import type { Provider } from './types.ts';

export type Env = Record<string, string | undefined>;

export function providerFromEnv(env: Env): Provider {
	const want = (env.PRICELENS_PROVIDER ?? 'mock').trim().toLowerCase();
	const serp = env.SERPAPI_API_KEY?.trim();
	if (want === 'real' && serp) {
		return new RealProvider({
			serpApiKey: serp,
			visionKey: env.GOOGLE_VISION_API_KEY?.trim() || undefined,
			country: env.PRICELENS_COUNTRY?.trim() || 'in',
			language: env.PRICELENS_LANGUAGE?.trim() || 'en'
		});
	}
	return new MockProvider();
}

export const mockProvider = new MockProvider();
export type { Provider };
