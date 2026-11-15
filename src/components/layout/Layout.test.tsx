import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// The shell renders the MSAL-aware sidebar; the drawer markup is what matters here.
vi.mock('@azure/msal-react', () => ({
  useMsal: () => ({ accounts: [], instance: { logoutRedirect: () => {} } }),
}));

import { Layout } from './Layout';

const render = () =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={['/content-reports']}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/content-reports" element={<p>queue</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe('Layout', () => {
  const html = render();

  it('renders the page content through the outlet', () => {
    expect(html).toContain('queue');
  });

  it('offers a mobile navigation toggle', () => {
    expect(html).toMatch(/aria-label="Open navigation"/);
  });

  it('starts the sidebar off-canvas so it cannot squeeze the table on small screens', () => {
    expect(html).toMatch(/<aside[^>]*-translate-x-full/);
  });

  it('keeps the sidebar inline from the md breakpoint up', () => {
    expect(html).toMatch(/<aside[^>]*md:static/);
  });
});
