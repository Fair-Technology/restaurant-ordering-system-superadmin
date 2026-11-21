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
