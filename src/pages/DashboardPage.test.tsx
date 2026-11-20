import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

const LONG_EMAIL = 'superadmin@fairaustralia.onmicrosoft.com';

vi.mock('@azure/msal-react', () => ({
  useMsal: () => ({ accounts: [{ username: 'superadmin@fairaustralia.onmicrosoft.com' }] }),
}));
vi.mock('../services/api', () => ({
  useGetShopsQuery: () => ({ data: undefined, isLoading: true }),
  useGetShopByIdQuery: () => ({ data: undefined }),
}));

import { DashboardPage } from './DashboardPage';

describe('DashboardPage welcome heading', () => {
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
  const h1 = html.match(/<h1[^>]*>/)?.[0] ?? '';

  it('shows the signed-in email', () => {
    expect(html).toContain(LONG_EMAIL);
  });

  // jsdom does no layout; the real 375px check was done in Chromium. An unbroken email has no
  // soft-wrap opportunity, so the heading must opt in to a forced break or it overflows the viewport.
  it('allows the unbroken email to break so it cannot overflow at 375px', () => {
    expect(h1).toMatch(/\[overflow-wrap:anywhere\]|break-all|break-words/);
  });
});
