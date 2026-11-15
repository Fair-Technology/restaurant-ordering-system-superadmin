import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { AuditEntry } from '../services/api';
import { AuditEntryCard } from './ShopActivityPage';

// The generated API client imports the MSAL config, which reads `window` at module load.
// There is no DOM in this test environment and AuditEntryCard never calls the query hook,
// so stub the module out.
vi.mock('../services/api', () => ({ useGetAuditEntriesQuery: vi.fn() }));

function entry(overrides: Partial<AuditEntry> = {}): AuditEntry {
  return {
    id: 'a1',
    shopId: 'shop-1',
    timestamp: '2026-11-13T10:30:00.000Z',
    actorType: 'superadmin',
    actorId: 'actor-1',
    action: 'staff.create',
    entityType: 'staff',
    entityId: 'e1',
    entityName: 'Jane Cashier',
    ...overrides,
  };
}

function render(e: AuditEntry, actorLabel = 'Platform support') {
  return renderToStaticMarkup(<AuditEntryCard entry={e} actorLabel={actorLabel} />);
}

describe('AuditEntryCard', () => {
  it('renders the human label for staff.create, not the raw key', () => {
    const html = render(entry());
    expect(html).toContain('created a staff account');
    expect(html).toContain('Jane Cashier');
    expect(html).not.toContain('staff.create');
  });

  it('renders the human label for shop.orders_auto_paused', () => {
    const html = render(
      entry({ action: 'shop.orders_auto_paused', entityType: 'shop', entityName: 'Corner Cafe' }),
    );
    expect(html).toContain('auto-paused ordering after missed orders');
    expect(html).toContain('Corner Cafe');
    expect(html).not.toContain('shop.orders_auto_paused');
  });

  it('falls back to the raw action key for an unknown action', () => {
    const html = render(entry({ action: 'shop.something_new', entityType: 'shop' }));
    expect(html).toContain('shop.something_new');
  });

  it('labels the reference_lists entity badge', () => {
    const html = render(entry({ action: 'reference_lists.update', entityType: 'reference_lists' }));
    expect(html).toContain('Reference list');
    expect(html).not.toContain('reference_lists');
  });

  it('shows the expand toggle only when there are changes', () => {
    expect(render(entry({ changes: [{ field: 'x', from: 1, to: 2 }] }))).toContain('<button');
    expect(render(entry())).not.toContain('<button');
    expect(render(entry({ changes: [] }))).not.toContain('<button');
  });

  it('shows the actor label', () => {
    expect(render(entry())).toContain('Platform support');
  });
});
