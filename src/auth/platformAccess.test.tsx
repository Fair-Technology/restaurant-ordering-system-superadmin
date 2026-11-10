import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { canWrite } from './access';
import { CanWriteContext } from './platformAccess';
import { WriteFieldset, WriteOnly } from './WriteOnly';

function render(value: boolean | undefined, node: React.ReactNode) {
  return renderToStaticMarkup(
    value === undefined ? <>{node}</> : <CanWriteContext.Provider value={value}>{node}</CanWriteContext.Provider>,
  );
}

const form = (
  <WriteFieldset>
    <input />
    <WriteOnly>
      <button>Save</button>
    </WriteOnly>
  </WriteFieldset>
);

describe('canWrite', () => {
  it('is true only for an explicit write', () => {
    expect(canWrite({ platformAccess: 'write' })).toBe(true);
    expect(canWrite({ platformAccess: 'read' })).toBe(false);
  });
  it('fails closed when the field is missing or the profile is not loaded', () => {
    expect(canWrite({})).toBe(false);
    expect(canWrite(undefined)).toBe(false);
  });
});

describe('write affordances for a read-only principal', () => {
  it('does not render the save button and disables the inputs', () => {
    const html = render(false, form);
    expect(html).not.toContain('Save');
    expect(html).toMatch(/<fieldset[^>]*disabled/);
  });
  it('fails closed with no provider mounted', () => {
    const html = render(undefined, form);
    expect(html).not.toContain('Save');
    expect(html).toMatch(/<fieldset[^>]*disabled/);
  });
  it('shows the button and enables the inputs for a write principal', () => {
    const html = render(true, form);
    expect(html).toContain('Save');
    expect(html).not.toMatch(/<fieldset[^>]*disabled/);
  });
});

describe('every page that mutates is gated', () => {
  const pages = import.meta.glob<string>('../pages/*Page.tsx', { query: '?raw', import: 'default', eager: true });
  const entries = Object.entries(pages);
  it('finds the pages', () => expect(entries.length).toBeGreaterThan(10));
  for (const [file, src] of entries) {
    if (!/use\w+Mutation\b/.test(src)) continue;
    it(`${file} uses WriteOnly/WriteFieldset/useCanWrite`, () => {
      expect(src).toMatch(/WriteOnly|WriteFieldset|useCanWrite/);
    });
  }
});
