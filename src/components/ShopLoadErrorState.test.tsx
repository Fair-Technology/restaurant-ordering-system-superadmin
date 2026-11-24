import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ShopLoadErrorState } from './ShopLoadErrorState';

const render = (status?: number) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <ShopLoadErrorState status={status} resource="usage" />
    </MemoryRouter>,
  );

describe('ShopLoadErrorState', () => {
  it('shows not found for 404', () => {
    expect(render(404)).toContain('Shop not found');
  });
  it('shows not allowed for 403', () => {
    expect(render(403)).toContain('Not allowed');
  });
  it('shows a generic failure otherwise, with a way back', () => {
    const html = render(500);
    expect(html).toContain('Failed to load usage');
    expect(html).toContain('← All Shops');
    expect(render(undefined)).toContain('Failed to load usage');
  });
});
