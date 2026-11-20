import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ShopUsagePage } from './ShopUsagePage';
import { useGetShopByIdQuery } from '../services/api';

// The generated API client imports the MSAL config, which reads `window` at module load,
// so stub the hooks the page uses.
vi.mock('../services/api', () => ({
  useGetShopByIdQuery: vi.fn(() => ({ data: { name: 'Ma Pasta' } })),
  useGetShopUsageQuery: vi.fn(() => ({
    isLoading: false,
    isError: false,
    data: {
      usage: { periodKey: '2026-11', acceptedOrderCount: 12, lastReconciled: null },
      ordersPerMonthLimit: 500,
      orderLimit: { warningLevel: 0, limitReached: false },
      rejections: {
        windowDays: 30,
        accepted: 12,
        rejectedByRestaurant: 1,
        rate: 0.08,
        recentRejections: 0,
        flags: [],
      },
    },
  })),
  useReconcileShopUsageMutation: vi.fn(() => [vi.fn(), { isLoading: false, data: undefined }]),
}));
vi.mock('../auth/WriteOnly', () => ({
  WriteOnly: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function render() {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={['/shops/shop-uuid-123/usage']}>
      <Routes>
        <Route path="/shops/:shopId/usage" element={<ShopUsagePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ShopUsagePage', () => {
  it('heads the page with the shop name, never the raw shop id', () => {
    const html = render();
    expect(html).toContain('Usage — Ma Pasta');
    expect(html).not.toContain('shop-uuid-123');
  });

  it('falls back to a bare "Usage" heading while the shop name is unresolved', () => {
    vi.mocked(useGetShopByIdQuery).mockReturnValue({ data: undefined } as never);
    const html = render();
    vi.mocked(useGetShopByIdQuery).mockReturnValue({ data: { name: 'Ma Pasta' } } as never);
    expect(html).toContain('>Usage</h1>');
    expect(html).not.toContain('shop-uuid-123');
  });
});
