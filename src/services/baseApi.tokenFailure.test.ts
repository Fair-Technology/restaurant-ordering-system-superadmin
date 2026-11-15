import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

const msal = vi.hoisted(() => ({
  getActiveAccount: vi.fn(),
  getAllAccounts: vi.fn(),
  acquireTokenSilent: vi.fn(),
  loginRedirect: vi.fn(),
}));

vi.mock('../auth/msalConfig', () => ({
  msalInstance: msal,
  apiRequest: { scopes: ['api://scope'] },
}));
vi.stubEnv('VITE_API_BASE_URL', 'http://test.invalid/api');

describe('token acquisition failure', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    msal.getActiveAccount.mockReset().mockReturnValue({ homeAccountId: 'x' });
    msal.getAllAccounts.mockReset().mockReturnValue([{ homeAccountId: 'x' }]);
    msal.acquireTokenSilent.mockReset().mockImplementation(() => Promise.reject(new Error('silent failed')));
    msal.loginRedirect.mockReset();
    fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ shops: [], total: 0 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);
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

  it('redirects once and sends no request when concurrent queries fail to get a token', async () => {
    const { api, store } = await setup();
    const [me, shops] = await Promise.all([
      store.dispatch(api.endpoints.getMe.initiate()),
      store.dispatch(api.endpoints.getShops.initiate()),
    ]);
    expect(msal.loginRedirect).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(me.error).toBeDefined();
    expect(shops.error).toBeDefined();
  });

  it('leaves the unauthenticated path unchanged (no account)', async () => {
    msal.getActiveAccount.mockReturnValue(null);
    msal.getAllAccounts.mockReturnValue([]);
    const { api, store } = await setup();
    await store.dispatch(api.endpoints.getShops.initiate());
    expect(fetchMock).toHaveBeenCalled();
    expect(msal.acquireTokenSilent).not.toHaveBeenCalled();
    expect(msal.loginRedirect).not.toHaveBeenCalled();
  });
});
