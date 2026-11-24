// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const useGetPlanPricingQuery = vi.fn();
const useGetPlanQuery = vi.fn();
vi.mock('../services/api', () => ({
  useGetPlanPricingQuery: (...args: unknown[]) => useGetPlanPricingQuery(...args),
  useGetPlanQuery: (...args: unknown[]) => useGetPlanQuery(...args),
  useSetPlanPricingMutation: () => [vi.fn(), { isLoading: false }],
  useGetShopByIdQuery: () => ({ data: undefined }),
}));
vi.mock('../auth/platformAccess', () => ({ useCanWrite: () => true }));

import { PlanPricingPage } from './PlanPricingPage';

function setup(pricing: unknown[], isDefault = false) {
  useGetPlanQuery.mockReturnValue({ data: { plan: { name: 'Pro', isDefault } } });
  useGetPlanPricingQuery.mockReturnValue({ data: pricing, isLoading: false });
  render(
    <MemoryRouter initialEntries={['/plans/p1/pricing']}>
      <Routes>
        <Route path="/plans/:planId/pricing" element={<PlanPricingPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function rowFor(currency: string): HTMLElement {
  return screen.getByText(currency).parentElement as HTMLElement;
}

describe('PlanPricingPage summary rows', () => {
  beforeEach(() => {
    useGetPlanPricingQuery.mockReset();
    useGetPlanQuery.mockReset();
  });
  afterEach(cleanup);

  it('shows "Not configured" (not 0.00) for a currency with no pricing row', () => {
    setup([]);
    const row = rowFor('EUR');
    expect(within(row).getByText('Not configured')).toBeTruthy();
    expect(row.textContent).not.toContain('0.00');
  });

  it('shows the saved monthly price, and no yearly price when yearly is 0', () => {
    setup([{ currency: 'EUR', monthlyAmountCents: 1999, yearlyAmountCents: 0 }]);
    const row = rowFor('EUR');
    expect(within(row).getByText('19.99')).toBeTruthy();
    expect(row.textContent).not.toContain('Not configured');
    expect(row.textContent).not.toContain('/yr');
    expect(row.textContent).not.toContain('0.00');
    // Other currencies stay unconfigured.
    expect(within(rowFor('AUD')).getByText('Not configured')).toBeTruthy();
  });

  it('shows the yearly price when the saved row has one', () => {
    setup([{ currency: 'USD', monthlyAmountCents: 1999, yearlyAmountCents: 19900 }]);
    const row = rowFor('USD');
    expect(within(row).getByText('199.00')).toBeTruthy();
    expect(row.textContent).toContain('/yr');
  });

  it('shows "Free" for the free/default plan regardless of pricing rows', () => {
    setup([{ currency: 'EUR', monthlyAmountCents: 1999, yearlyAmountCents: 0 }], true);
    expect(within(rowFor('EUR')).getByText('Free')).toBeTruthy();
    expect(within(rowFor('AUD')).getByText('Free')).toBeTruthy();
    expect(screen.queryByText('Not configured')).toBeNull();
  });
});
