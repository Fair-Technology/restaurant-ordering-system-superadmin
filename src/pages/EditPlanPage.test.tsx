import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const useGetPlanQuery = vi.fn();
vi.mock('../services/api', () => ({
  useGetPlanQuery: (...args: unknown[]) => useGetPlanQuery(...args),
  useUpdatePlanMutation: () => [vi.fn(), { isLoading: false }],
  useGetShopByIdQuery: () => ({ data: undefined }),
}));

import { EditPlanPage } from './EditPlanPage';

function render() {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={['/plans/missing']}>
      <Routes>
        <Route path="/plans/:planId" element={<EditPlanPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('EditPlanPage load errors', () => {
  beforeEach(() => useGetPlanQuery.mockReset());

  it('shows "Plan not found" with a back button and no retry on 404', () => {
    useGetPlanQuery.mockReturnValue({ isLoading: false, isError: true, error: { status: 404, data: {} }, refetch: vi.fn() });
    const html = render();
    expect(html).toContain('Plan not found');
    expect(html).toContain('← Plans');
    expect(html).not.toContain('Retry');
  });

  it('shows a retry control for a non-404 error', () => {
    useGetPlanQuery.mockReturnValue({ isLoading: false, isError: true, error: { status: 500, data: {} }, refetch: vi.fn() });
    const html = render();
    expect(html).toContain('Failed to load plan');
    expect(html).toContain('← Plans');
    expect(html).toMatch(/<button[^>]*>Retry<\/button>/);
  });

  it('treats FETCH_ERROR as a generic error, not 404', () => {
    useGetPlanQuery.mockReturnValue({ isLoading: false, isError: true, error: { status: 'FETCH_ERROR', error: 'x' }, refetch: vi.fn() });
    const html = render();
    expect(html).not.toContain('Plan not found');
    expect(html).toContain('Retry');
  });
});
