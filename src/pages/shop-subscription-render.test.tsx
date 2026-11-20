import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ShopSubscriptionPage } from './ShopSubscriptionPage';

// The generated API client imports the MSAL config, which reads `window` at module load,
// so stub the hooks the page uses.
vi.mock('../services/api', () => ({
  useGetShopByIdQuery: vi.fn(() => ({ data: { name: 'Ma Pasta' } })),
  useGetShopSubscriptionQuery: vi.fn(() => ({
    isLoading: false,
    isError: false,
    isFetching: false,
    data: {
      subscription: {
        planId: 'p1',
        limitOverride: {
          limits: [{ key: 'ORDERS_PER_MONTH', value: 500 }],
          reason: 'goodwill',
          expiresAt: null,
        },
      },
      plan: { id: 'p1', name: 'Starter' },
      entitlements: { planId: 'p1', limitOverrideActive: true },
    },
  })),
  useGetPlansQuery: vi.fn(() => ({ data: { plans: [] } })),
  useOverrideShopSubscriptionMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useSetLimitOverrideMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useClearLimitOverrideMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
}));
vi.mock('../auth/WriteOnly', () => ({
  WriteOnly: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function render() {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={['/shops/shop-uuid-123/subscription']}>
      <Routes>
        <Route path="/shops/:shopId/subscription" element={<ShopSubscriptionPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ShopSubscriptionPage', () => {
  it('heads the page with the shop name, never the raw shop id', () => {
    const html = render();
    expect(html).toContain('Subscription — Ma Pasta');
    expect(html).not.toContain('shop-uuid-123');
  });

  it('shows human limit labels, not raw enum keys', () => {
    const html = render();
    expect(html).toContain('Orders per month');
    expect(html).toContain('Staff accounts');
    expect(html).not.toContain('>ORDERS_PER_MONTH<');
    expect(html).not.toContain('>STAFF_ACCOUNTS<');
  });
});
