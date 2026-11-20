import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The repo's tests run in node with renderToStaticMarkup (no DOM, effects never fire), so run
// effects synchronously over a stubbed `document` and keep the cleanups to simulate unmount.
const cleanups = vi.hoisted((): Array<() => void> => []);
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useEffect: (fn: () => void | (() => void)) => {
      const cleanup = fn();
      if (cleanup) cleanups.push(cleanup);
    },
  };
});
const queryMock = vi.hoisted(() => vi.fn());
vi.mock('../../services/api', () => ({ useGetShopByIdQuery: queryMock }));

import { usePageTitle } from './usePageTitle';

const doc = { title: '' };
vi.stubGlobal('document', doc);

function Host({ page }: { page: string }) {
  usePageTitle(page);
  return null;
}

function renderAt(url: string, page: string) {
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/shops/:shopId/*" element={<Host page={page} />} />
        <Route path="*" element={<Host page={page} />} />
      </Routes>
    </MemoryRouter>,
  );
  return () => cleanups.splice(0).forEach((c) => c());
}

beforeEach(() => {
  cleanups.length = 0;
  doc.title = 'initial';
  queryMock.mockReset();
  queryMock.mockImplementation((_arg: unknown, opts?: { skip?: boolean }) => ({
    data: opts?.skip ? undefined : { name: 'Golden Wok' },
  }));
});

describe('usePageTitle', () => {
  it('uses "<Page> · Superadmin" without a shop in context', () => {
    renderAt('/plans', 'Plans');
    expect(doc.title).toBe('Plans · Superadmin');
  });

  it('skips the shop lookup when there is no :shopId', () => {
    renderAt('/plans', 'Plans');
    expect(queryMock).toHaveBeenCalledWith({ shopId: undefined }, { skip: true });
  });

  it('includes the shop name for shop-scoped pages, differing per page', () => {
    const titles = ['Orders', 'Activity', 'Usage'].map((page) => {
      const unmount = renderAt('/shops/s1/page', page);
      const title = doc.title;
      unmount();
      return title;
    });
    expect(titles).toEqual([
      'Orders · Golden Wok · Superadmin',
      'Activity · Golden Wok · Superadmin',
      'Usage · Golden Wok · Superadmin',
    ]);
  });

  it('falls back to no shop name while the shop is not loaded', () => {
    queryMock.mockReturnValue({ data: undefined });
    renderAt('/shops/s1/page', 'Orders');
    expect(doc.title).toBe('Orders · Superadmin');
  });

  it('restores the previous title on unmount', () => {
    const unmount = renderAt('/shops/s1/page', 'Orders');
    expect(doc.title).not.toBe('initial');
    unmount();
    expect(doc.title).toBe('initial');
  });
});
