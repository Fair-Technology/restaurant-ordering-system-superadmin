// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../features/layout/usePageTitle', () => ({ usePageTitle: () => {} }));
vi.mock('../services/api', () => ({
  useGetRejectionWatchQuery: () => ({
    isLoading: false,
    isError: false,
    data: {
      shops: [
        {
          shopId: 's1',
          name: 'Test Cafe',
          orderLimit: { acceptedOrderCount: 40, limit: 100, warningLevel: 80 },
          rejections: { rate: 0.5, rejectedByRestaurant: 9, flags: [] },
        },
      ],
    },
  }),
}));

import { RejectionWatchPage } from './RejectionWatchPage';

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(cleanup);

describe('RejectionWatchPage layout', () => {
  it('renders every column header inside the horizontally scrollable card', () => {
    render(<MemoryRouter><RejectionWatchPage /></MemoryRouter>);
    const container = screen.getByTestId('scroll-container');
    expect(container.className).toContain('overflow-x-auto');
    for (const name of ['Restaurant', 'Orders this month', 'Warning', 'Decline rate', 'Flags']) {
      expect(within(container).getByRole('columnheader', { name })).toBeTruthy();
    }
  });
});
