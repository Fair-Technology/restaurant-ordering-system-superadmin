// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@azure/msal-react', () => ({
  useMsal: () => ({ accounts: [], instance: { logoutRedirect: () => {} } }),
}));

import { Sidebar } from './Sidebar';

function stubViewport(desktop: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(min-width: 768px)' ? desktop : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

const renderSidebar = (open: boolean) =>
  render(
    <MemoryRouter>
      <Sidebar open={open} onClose={() => {}} />
    </MemoryRouter>,
  );

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Sidebar drawer inertness', () => {
  it('is inert and aria-hidden when closed below md', () => {
    stubViewport(false);
    const { container } = renderSidebar(false);
    const aside = container.querySelector('aside')!;
    expect(aside.hasAttribute('inert')).toBe(true);
    expect(aside.getAttribute('aria-hidden')).toBe('true');
  });

  it('is interactive when open below md and moves focus to Close navigation', () => {
    stubViewport(false);
    const { container } = renderSidebar(true);
    const aside = container.querySelector('aside')!;
    expect(aside.hasAttribute('inert')).toBe(false);
    expect(aside.hasAttribute('aria-hidden')).toBe(false);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close navigation' }));
  });

  it('is never inert from md up, even when "closed"', () => {
    stubViewport(true);
    const { container } = renderSidebar(false);
    const aside = container.querySelector('aside')!;
    expect(aside.hasAttribute('inert')).toBe(false);
    expect(aside.hasAttribute('aria-hidden')).toBe(false);
  });
});

const renderAt = (path: string) => {
  stubViewport(true);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar />
    </MemoryRouter>,
  );
};

describe('Sidebar active link', () => {
  it('marks only the active link with aria-current="page"', () => {
    renderAt('/plans');
    expect(screen.getByRole('link', { name: 'Plans' }).getAttribute('aria-current')).toBe('page');
    const current = screen.getAllByRole('link').filter((a) => a.hasAttribute('aria-current'));
    expect(current).toHaveLength(1);
  });

  it('marks Dashboard (not every link) as current on /', () => {
    renderAt('/');
    expect(screen.getByRole('link', { name: 'Dashboard' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Shops' }).hasAttribute('aria-current')).toBe(false);
  });
});

describe('Sidebar Settings link', () => {
  it('exists and is current on /settings', () => {
    renderAt('/settings');
    expect(screen.getByRole('link', { name: 'Settings' }).getAttribute('aria-current')).toBe('page');
  });
});

describe('Sidebar Orders item', () => {
  it('is an aria-disabled, non-focusable link without a shop in the URL', () => {
    renderAt('/plans');
    const orders = screen.getByText('Orders').closest('span[role="link"]')!;
    expect(orders.getAttribute('aria-disabled')).toBe('true');
    expect(orders.hasAttribute('tabindex')).toBe(false);
    expect(orders.hasAttribute('href')).toBe(false);
    expect(screen.getByText(/unavailable/).className).toContain('sr-only');
  });

  it('is a real link under /shops/:shopId', () => {
    renderAt('/shops/abc');
    const orders = screen.getByRole('link', { name: 'Orders' });
    expect(orders.getAttribute('href')).toBe('/shops/abc/orders');
    expect(orders.hasAttribute('aria-disabled')).toBe(false);
  });
});
