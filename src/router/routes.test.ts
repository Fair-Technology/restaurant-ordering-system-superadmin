import { beforeAll, describe, expect, it, vi } from 'vitest';
import { isValidElement } from 'react';

vi.mock('../auth/msalConfig', () => ({
  msalInstance: {
    getActiveAccount: () => null,
    getAllAccounts: () => [],
    initialize: () => Promise.resolve(),
    addEventCallback: () => null,
  },
  loginRequest: {},
  apiRequest: { scopes: [] },
}));

// createBrowserRouter reads window.history / window.location, absent in the node environment.
const storage = { getItem: () => null, setItem() {}, removeItem() {} };
vi.stubGlobal('localStorage', storage);
vi.stubGlobal('sessionStorage', storage);
const fakeWindow = {
  location: { pathname: '/', search: '', hash: '', href: 'http://localhost/', origin: 'http://localhost', assign() {} },
  history: { state: null, length: 1, pushState() {}, replaceState() {}, scrollRestoration: 'auto' },
  addEventListener() {},
  removeEventListener() {},
};
vi.stubGlobal('window', fakeWindow);
vi.stubGlobal('document', { defaultView: fakeWindow });

let routes: Array<{ path?: string; errorElement?: unknown; children?: Array<{ path?: string }> }>;

beforeAll(async () => {
  const { router } = await import('./index');
  routes = router.routes as typeof routes;
});

describe('route table', () => {
  it('has a catch-all child under the app layout route', () => {
    const root = routes.find((r) => r.path === '/');
    expect(root?.children?.some((c) => c.path === '*')).toBe(true);
  });
  it('routes the content-report queue under the app layout route', () => {
    const root = routes.find((r) => r.path === '/');
    expect(root?.children?.some((c) => c.path === 'content-reports')).toBe(true);
  });
  it('routes the Settings page under the app layout route', () => {
    const root = routes.find((r) => r.path === '/');
    expect(root?.children?.some((c) => c.path === 'settings')).toBe(true);
  });
  it('gives every top-level route an errorElement', () => {
    expect(routes.length).toBeGreaterThan(0);
    for (const r of routes) expect(isValidElement(r.errorElement)).toBe(true);
  });
});
