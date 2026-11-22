// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeAll, afterEach } from 'vitest';
import { ScrollableTableCard } from './ScrollableTableCard';

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

function renderWith(scrollWidth: number, clientWidth: number, bare = false) {
  const proto = HTMLElement.prototype;
  const sw = vi.spyOn(proto, 'scrollWidth', 'get').mockReturnValue(scrollWidth);
  const cw = vi.spyOn(proto, 'clientWidth', 'get').mockReturnValue(clientWidth);
  render(
    <ScrollableTableCard bare={bare}>
      <table>
        <tbody>
          <tr>
            <td>x</td>
          </tr>
        </tbody>
      </table>
    </ScrollableTableCard>,
  );
  return () => {
    sw.mockRestore();
    cw.mockRestore();
  };
}

afterEach(cleanup);

describe('ScrollableTableCard', () => {
  it('shows the affordance when content overflows', () => {
    const restore = renderWith(800, 375);
    const el = screen.getByTestId('scroll-affordance');
    expect(el.getAttribute('aria-hidden')).toBe('true');
    restore();
  });

  it('hides the affordance when content fits', () => {
    const restore = renderWith(375, 375);
    expect(screen.queryByTestId('scroll-affordance')).toBeNull();
    restore();
  });

  it('renders inside a glass-card wrapper by default', () => {
    const restore = renderWith(375, 375);
    const wrapper = screen.getByTestId('scroll-container').parentElement!;
    expect(wrapper.className).toContain('glass-card');
    expect(wrapper.className).toContain('mb-4');
    restore();
  });

  it('skips the glass-card wrapper when bare', () => {
    const restore = renderWith(800, 375, true);
    const wrapper = screen.getByTestId('scroll-container').parentElement!;
    expect(wrapper.className).not.toContain('glass-card');
    expect(wrapper.className).not.toContain('mb-4');
    expect(screen.getByTestId('scroll-affordance')).toBeTruthy();
    restore();
  });
});
