import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ShopActivityPage } from './ShopActivityPage';

// The generated API client imports the MSAL config, which reads `window` at module load,
// so stub the hooks the page uses.
vi.mock('../services/api', () => ({
  useGetShopByIdQuery: vi.fn(() => ({ data: { name: 'Ma Pasta' } })),
  useGetAuditEntriesQuery: vi.fn(() => ({
    isLoading: false,
    isError: false,
    data: { entries: [], total: 0 },
  })),
}));

describe('ShopActivityPage breadcrumb', () => {
  it('shows the shop name, not the raw shop id, when reached without router state', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/shops/shop-uuid-123/activity']}>
        <Routes>
          <Route path="/shops/:shopId/activity" element={<ShopActivityPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(html).toContain('Ma Pasta');
    expect(html).not.toContain('shop-uuid-123');
  });
});
