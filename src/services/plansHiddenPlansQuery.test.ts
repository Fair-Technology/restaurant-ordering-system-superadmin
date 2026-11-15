import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('../auth/msalConfig', () => ({
  msalInstance: { getActiveAccount: () => null, getAllAccounts: () => [] },
  apiRequest: {},
}));
vi.stubEnv('VITE_API_BASE_URL', 'http://test.invalid/api');

describe('getPlans query arg reaches the wire', () => {
  let urls: string[];

  beforeEach(() => {
    urls = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (req: Request) => {
        urls.push(req.url);
        return new Response(JSON.stringify({ plans: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  async function setup() {
    const { api } = await import('./api');
    const store = configureStore({
      reducer: { [api.reducerPath]: api.reducer },
      middleware: (g) => g().concat(api.middleware),
    });
    return { api, store };
  }

  it('sends includeHidden=true when the operator surfaces ask for hidden plans', async () => {
    const { api, store } = await setup();
    store.dispatch(api.endpoints.getPlans.initiate({ includeHidden: true }));
    await vi.waitFor(() => expect(urls.length).toBe(1));
    expect(urls[0]).toBe('http://test.invalid/api/plans?includeHidden=true');
  });

  it('still sends a bare /plans when no arg is passed (customer default unchanged)', async () => {
    const { api, store } = await setup();
    store.dispatch(api.endpoints.getPlans.initiate({}));
    await vi.waitFor(() => expect(urls.length).toBe(1));
    expect(new URL(urls[0]).pathname).toBe('/api/plans');
    expect(new URL(urls[0]).searchParams.has('includeHidden')).toBe(false);
  });
});
