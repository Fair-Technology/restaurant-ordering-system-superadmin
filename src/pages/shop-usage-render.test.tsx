// @vitest-environment jsdom
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render as rtlRender, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ShopUsagePage } from './ShopUsagePage';
import { useGetShopByIdQuery, useReconcileShopUsageMutation } from '../services/api';

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

  describe('auto-reconcile', () => {
    afterEach(cleanup);

    // A stateful stand-in for the RTK mutation: the trigger stores the result as `data`.
    function useFakeMutation(trigger: (arg: { shopId: string }) => void) {
      const [data, setData] = useState<unknown>(undefined);
      return [
        (arg: { shopId: string }) => {
          trigger(arg);
          setData({
            reconciledCount: 14,
            usage: { periodKey: '2026-11', acceptedOrderCount: 14, lastReconciled: '2026-11-24T00:00:00Z' },
          });
        },
        { isLoading: false, data },
      ] as never;
    }

    function mountPage() {
      return rtlRender(
        <MemoryRouter initialEntries={['/shops/shop-uuid-123/usage']}>
          <Routes>
            <Route path="/shops/:shopId/usage" element={<ShopUsagePage />} />
          </Routes>
        </MemoryRouter>,
      );
    }

    it('reconciles once on mount without showing the confirmation, and shows it after a manual click', () => {
      const trigger = vi.fn();
      vi.mocked(useReconcileShopUsageMutation).mockImplementation(() => useFakeMutation(trigger));

      mountPage();
      expect(trigger).toHaveBeenCalledTimes(1);
      expect(trigger).toHaveBeenCalledWith({ shopId: 'shop-uuid-123' });
      expect(screen.queryByText(/Reconciled: counted/)).toBeNull();
      // Freshest usage is still displayed.
      expect(screen.getByText(/14/)).toBeTruthy();

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Reconcile Now' }));
      });
      expect(trigger).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Reconciled: counted 14 accepted orders this month.')).toBeTruthy();
    });
  });
});
