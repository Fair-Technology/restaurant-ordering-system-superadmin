import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Node-only harness (see usePageTitle.test.tsx): effects run synchronously over a stubbed document.
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, useEffect: (fn: () => void | (() => void)) => void fn() };
});
// The store pulls in msalConfig, which needs `window`.
vi.mock('../auth/msalConfig', () => ({ msalInstance: { logoutRedirect: vi.fn(), getActiveAccount: () => null, acquireTokenSilent: vi.fn() } }));
vi.mock('@azure/msal-react', () => ({
  useMsal: () => ({ accounts: [], instance: { logoutRedirect: () => {} } }),
}));
vi.mock('../services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/api')>();
  return {
    ...actual,
    useGetShopsQuery: () => ({ data: [], isLoading: false }),
    useGetShopByIdQuery: (_arg: unknown, opts?: { skip?: boolean }) => ({
      data: opts?.skip ? undefined : { name: 'Golden Wok' },
    }),
    useGetOrdersByShopQuery: () => ({ data: undefined, isLoading: true }),
  };
});

import { store } from '../store/store';
import { DashboardPage } from './DashboardPage';
import { ShopsPage } from './ShopsPage';
import { ShopOrdersPage } from './ShopOrdersPage';

const doc = { title: '' };
vi.stubGlobal('document', doc);

function renderPage(url: string, path: string, element: React.ReactElement) {
  renderToStaticMarkup(
    <Provider store={store}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path={path} element={element} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

beforeEach(() => {
  doc.title = 'initial';
});

describe('page titles (render)', () => {
  it('DashboardPage', () => {
    renderPage('/', '/', <DashboardPage />);
    expect(doc.title).toBe('Dashboard · Superadmin');
  });

  it('ShopsPage', () => {
    renderPage('/shops', '/shops', <ShopsPage />);
    expect(doc.title).toBe('Shops · Superadmin');
  });

  it('ShopOrdersPage includes the shop name', () => {
    renderPage('/shops/s1/orders', '/shops/:shopId/orders', <ShopOrdersPage />);
    expect(doc.title).toBe('Orders · Golden Wok · Superadmin');
  });
});

describe('every routed page sets a title', () => {
  const pages: Record<string, string> = {
    Dashboard: 'Dashboard', Shops: 'Shops', ShopOrders: 'Orders', ShopActivity: 'Activity',
    ShopSubscription: 'Subscription', ShopUsage: 'Usage', RejectionWatch: 'Decline Watch',
    Plans: 'Plans', EditPlan: 'Edit Plan', PlanPricing: 'Plan Pricing', RolePermissions: 'Roles',
    ReferenceLists: 'Food & Tax Lists', PlatformLegal: 'Legal', NameChangeRequests: 'Name Changes',
    ContentReports: 'Content Reports', Login: 'Login', NotFound: 'Not Found',
    AccessDenied: 'Access Denied', ProfileLoadError: 'Profile Error', RouteError: 'Error',
  };
  const sources = import.meta.glob<string>('./*Page.tsx', { query: '?raw', import: 'default', eager: true });
  it.each(Object.entries(pages))('%sPage calls usePageTitle(%j)', (file, title) => {
    const src = sources[`./${file}Page.tsx`];
    const body = src.slice(src.indexOf(`export function ${file}Page(`));
    const open = body.indexOf('{\n');
    expect(body.slice(open + 2).startsWith(`  usePageTitle('${title}');\n`)).toBe(true);
  });
});
