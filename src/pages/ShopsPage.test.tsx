// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

const shops = [
  { id: 'a1', name: 'Alpha Cafe', slug: 'alpha', currency: 'AUD', createdAt: '2025-01-01T00:00:00Z', isDeleted: false },
  { id: 'b2', name: 'Beta Bistro', slug: 'beta', currency: 'NZD', createdAt: '2025-02-01T00:00:00Z', isDeleted: false },
];

vi.mock('../auth/platformAccess', () => ({ useCanWrite: () => true }));
vi.mock('../features/layout/usePageTitle', () => ({ usePageTitle: () => undefined }));
vi.mock('../services/api', () => ({
  useGetShopsQuery: () => ({ data: { shops }, isLoading: false, isError: false }),
  useRestoreShopMutation: () => [vi.fn(), { isLoading: false }],
  useSetMissedOrdersPauseLimitMutation: () => [vi.fn(), { isLoading: false }],
  useSetShopOfflineBySuperadminMutation: () => [vi.fn(), { isLoading: false }],
  useUpdateShopMutation: () => [vi.fn(), { isLoading: false }],
  useGetShopByIdQuery: () => ({ data: undefined, isError: false }),
}));

import { ShopsPage } from './ShopsPage';

function render() {
  const container = document.createElement('div');
  container.innerHTML = renderToStaticMarkup(
    <MemoryRouter>
      <ShopsPage />
    </MemoryRouter>,
  );
  return container;
}

// jsdom does no layout, so assert the Tailwind visibility classes rather than media queries.
describe('ShopsPage responsive layout', () => {
  const dom = render();

  it('gates the table to sm+ and the card list to below sm', () => {
    const table = dom.querySelector('table');
    expect(table?.closest('.hidden.sm\\:block')).not.toBeNull();
    const list = dom.querySelector('[data-testid="shops-cards"]');
    expect(list?.className).toContain('sm:hidden');
  });

  it('scopes each shop\'s actions inside the same card as its name', () => {
    const cards = dom.querySelectorAll('[data-testid^="shop-card-"]');
    expect(cards).toHaveLength(2);
    const [alpha, beta] = Array.from(cards);
    expect(alpha.textContent).toContain('Alpha Cafe');
    expect(alpha.querySelector('[aria-label="Subscription for Alpha Cafe"]')).not.toBeNull();
    expect(alpha.querySelector('[aria-label="Usage for Alpha Cafe"]')).not.toBeNull();
    expect(alpha.querySelector('[aria-label="Activity for Alpha Cafe"]')).not.toBeNull();
    expect(alpha.querySelector('[aria-label="Take offline for Alpha Cafe"]')).not.toBeNull();
    expect(alpha.querySelector('[aria-label*="Beta Bistro"]')).toBeNull();
    expect(alpha.textContent).toContain('alpha');
    expect(alpha.textContent).toContain('AUD');
    expect(beta.textContent).toContain('Beta Bistro');
    expect(beta.querySelector('[aria-label="Take offline for Beta Bistro"]')).not.toBeNull();
    expect(beta.querySelector('[aria-label*="Alpha Cafe"]')).toBeNull();
  });
});
