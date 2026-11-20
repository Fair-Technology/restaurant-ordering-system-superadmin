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

function renderWith(scrollWidth: number, clientWidth: number) {
  const proto = HTMLElement.prototype;
  const sw = vi.spyOn(proto, 'scrollWidth', 'get').mockReturnValue(scrollWidth);
  const cw = vi.spyOn(proto, 'clientWidth', 'get').mockReturnValue(clientWidth);
  render(
    <ScrollableTableCard>
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
});
