import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
// The store pulls in msalConfig, which needs `window`.
vi.mock('../auth/msalConfig', () => ({ msalInstance: { logoutRedirect: vi.fn(), getActiveAccount: () => null, acquireTokenSilent: vi.fn() } }));

import { Provider } from 'react-redux';
import { store } from '../store/store';
import { NotFoundPage } from './NotFoundPage';

describe('NotFoundPage', () => {
  const html = renderToStaticMarkup(
    <Provider store={store}>
    <MemoryRouter initialEntries={['/nope']}>
      <Routes>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MemoryRouter>
    </Provider>,
  );

  it('renders the heading', () => {
    expect(html).toContain('Page not found');
  });
  it('renders a real link back to the dashboard', () => {
    expect(html).toMatch(/<a [^>]*href="\/"[^>]*>(?:<[^>]+>)*Back to dashboard/);
  });
});
