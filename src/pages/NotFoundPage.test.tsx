import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NotFoundPage } from './NotFoundPage';

describe('NotFoundPage', () => {
  const html = renderToStaticMarkup(
    <MemoryRouter initialEntries={['/nope']}>
      <Routes>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MemoryRouter>,
  );

  it('renders the heading', () => {
    expect(html).toContain('Page not found');
  });
  it('renders a real link back to the dashboard', () => {
    expect(html).toMatch(/<a [^>]*href="\/"[^>]*>(?:<[^>]+>)*Back to dashboard/);
  });
});
