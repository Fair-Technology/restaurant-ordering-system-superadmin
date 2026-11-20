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

  it('renders header above and footer below the scroll container, outside it', () => {
    render(
      <ScrollableTableCard header={<h2>Head</h2>} footer={<p>Foot</p>}>
        <table><tbody><tr><td>x</td></tr></tbody></table>
      </ScrollableTableCard>,
    );
    const container = screen.getByTestId('scroll-container');
    const head = screen.getByText('Head');
    const foot = screen.getByText('Foot');
    expect(container.contains(head)).toBe(false);
    expect(container.contains(foot)).toBe(false);
    expect(head.compareDocumentPosition(container) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.compareDocumentPosition(foot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.parentElement!.className).toContain('glass-card');
  });

  it('works unchanged without header/footer', () => {
    const restore = renderWith(375, 375);
    expect(screen.getByTestId('scroll-container').parentElement!.children).toHaveLength(1);
    restore();
  });
});
