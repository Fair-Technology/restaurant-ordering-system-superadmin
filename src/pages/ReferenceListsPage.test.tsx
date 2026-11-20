// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../features/layout/usePageTitle', () => ({ usePageTitle: () => {} }));
vi.mock('../auth/platformAccess', () => ({ useCanWrite: () => true }));
vi.mock('../services/api', () => ({
  useUpdateReferenceListsMutation: () => [vi.fn(), { isLoading: false }],
  useGetReferenceListsQuery: () => ({
    isLoading: false,
    isError: false,
    data: {
      updatedAt: null,
      defaultTaxClassId: 'std',
      allergens: [{ id: 'gluten', labels: { de: 'Gluten', en: 'Gluten' }, isActive: true }],
      additives: [{ id: 'a1', code: 1, labels: { de: 'Farbstoff', en: 'Colour' }, isActive: true }],
      taxClasses: [{ id: 'std', labels: { de: 'Standard', en: 'Standard' }, isActive: true }],
      taxRates: [
        { taxClassId: 'std', fulfilmentMode: 'delivery', rateBasisPoints: 700, effectiveFrom: '2024-01-01T00:00:00Z' },
      ],
    },
  }),
}));

import { ReferenceListsPage } from './ReferenceListsPage';

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(cleanup);

function cardFor(title: string) {
  const heading = screen.getByRole('heading', { name: title });
  const card = heading.closest('.glass-card') as HTMLElement;
  const container = within(card).getByTestId('scroll-container');
  return { heading, card, container, table: within(container).getByRole('table') };
}

describe('ReferenceListsPage 375px layout', () => {
  it.each([
    ['Allergens', 'min-w-[560px]'],
    ['Additives', 'min-w-[620px]'],
    ['Tax classes', 'min-w-[620px]'],
    ['Tax rates', 'min-w-[640px]'],
  ])('%s table scrolls inside its card with a min width (%s)', (title, minW) => {
    render(<ReferenceListsPage />);
    const { heading, container, table } = cardFor(title);
    expect(container.className).toContain('overflow-x-auto');
    expect(table.className).toContain(minW);
    // header stays outside the scrolling region
    expect(container.contains(heading)).toBe(false);
  });

  it('gives name inputs room to breathe and keeps the add-rate form outside the scroller', () => {
    render(<ReferenceListsPage />);
    const { container } = cardFor('Allergens');
    const nameCells = within(container).getAllByRole('textbox').map((i) => i.closest('td')!);
    expect(nameCells.every((td) => td.className.includes('min-w-[140px]'))).toBe(true);

    const rates = cardFor('Tax rates');
    const addRate = screen.getByRole('button', { name: '+ Add rate' });
    expect(rates.card.contains(addRate)).toBe(true);
    expect(rates.container.contains(addRate)).toBe(false);
  });
});
