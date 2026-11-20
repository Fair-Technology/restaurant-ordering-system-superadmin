import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

const useGetPlansQuery = vi.fn();
vi.mock('../services/api', () => ({
  useGetPlansQuery: (...args: unknown[]) => useGetPlansQuery(...args),
  useCreatePlanMutation: () => [vi.fn(), { isLoading: false }],
}));
vi.mock('../auth/platformAccess', () => ({ useCanWrite: () => true }));
vi.mock('../auth/WriteOnly', () => ({
  WriteOnly: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../features/layout/usePageTitle', () => ({ usePageTitle: () => undefined }));

import { PlansPage } from './PlansPage';

function plan(id: string, limits: { key: string; value: number }[]) {
  return { id, name: `Plan ${id}`, key: id, isVisible: true, isDefault: false, sortOrder: 1, limits };
}

function render() {
  return renderToStaticMarkup(
    <MemoryRouter>
      <PlansPage />
    </MemoryRouter>,
  );
}

describe('PlansPage Limits column', () => {
  beforeEach(() => useGetPlansQuery.mockReset());

  it('renders human labels joined by " · " instead of raw enum keys', () => {
    useGetPlansQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { plans: [plan('a', [{ key: 'ORDERS_PER_MONTH', value: 30 }, { key: 'STAFF_ACCOUNTS', value: 5 }])] },
    });
    const html = render();
    expect(html).toContain('Orders per month: 30 · Staff accounts: 5');
    expect(html).not.toContain('ORDERS_PER_MONTH');
    expect(html).not.toContain('STAFF_ACCOUNTS');
  });

  it('shows ∞ for -1, falls back to the raw key when unknown, and — when empty', () => {
    useGetPlansQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { plans: [plan('b', [{ key: 'ORDERS_PER_MONTH', value: -1 }, { key: 'FUTURE_KEY', value: 2 }]), plan('c', [])] },
    });
    const html = render();
    expect(html).toContain('Orders per month: ∞ · FUTURE_KEY: 2');
    expect(html).toContain('>—</td>');
  });
});
