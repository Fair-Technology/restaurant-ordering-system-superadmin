import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
// msalConfig builds a PublicClientApplication that needs `window`; the test never signs out.
vi.mock('../auth/msalConfig', () => ({ msalInstance: { logoutRedirect: vi.fn() } }));

import { Provider } from 'react-redux';
import { store } from '../store/store';
import { ProfileLoadErrorPage } from './ProfileLoadErrorPage';

describe('ProfileLoadErrorPage', () => {
  const html = renderToStaticMarkup(
    <Provider store={store}>
      <ProfileLoadErrorPage onRetry={() => {}} />
    </Provider>,
  );

  it('renders as an alert with the title', () => {
    expect(html).toContain('role="alert"');
    expect(html).toContain('load your profile');
  });

  it('offers retry and sign-out buttons', () => {
    expect(html).toMatch(/<button[^>]*type="button"[^>]*>Try again<\/button>/);
    expect(html).toMatch(/<button[^>]*type="button"[^>]*>Sign out<\/button>/);
  });
});
