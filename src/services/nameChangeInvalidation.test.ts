import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('../auth/msalConfig', () => ({
  msalInstance: { getActiveAccount: () => null, getAllAccounts: () => [] },
  apiRequest: {},
}));
vi.stubEnv('VITE_API_BASE_URL', 'http://test.invalid/api');

describe('approving or rejecting a name change refreshes the shops list', () => {
  let calls: string[];

  beforeEach(() => {
    calls = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (req: Request) => {
        calls.push(`${req.method} ${new URL(req.url).pathname}`);
        return new Response(JSON.stringify({ shops: [], total: 0, id: 's1', updatedAt: 'x' }), {
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
    store.dispatch(api.endpoints.getShops.initiate());
    await vi.waitFor(() => expect(calls).toEqual(['GET /api/shops']));
    return { api, store };
  }

  it('refetches /shops after approve', async () => {
    const { api, store } = await setup();
    await store.dispatch(api.endpoints.approveShopNameChange.initiate({ shopId: 's1' }));
    await vi.waitFor(() => expect(calls.filter((c) => c === 'GET /api/shops')).toHaveLength(2));
  });

  it('refetches /shops after reject', async () => {
    const { api, store } = await setup();
    await store.dispatch(api.endpoints.rejectShopNameChange.initiate({ shopId: 's1' }));
    await vi.waitFor(() => expect(calls.filter((c) => c === 'GET /api/shops')).toHaveLength(2));
  });
});
