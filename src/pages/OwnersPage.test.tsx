// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const owners = [
  { userId: 'u-zero', email: 'zero@x.com', name: 'Zero Shops', maxShops: null, effectiveLimit: 3, shopCount: 0 },
  { userId: 'u-default', email: 'def@x.com', name: 'Default Dan', maxShops: null, effectiveLimit: 3, shopCount: 1 },
  { userId: 'u-unl', email: 'unl@x.com', name: 'Unlimited Uma', maxShops: -1, effectiveLimit: -1, shopCount: 9 },
  { userId: 'u-lim', email: 'lim@x.com', name: 'Limit Lee', maxShops: 2, effectiveLimit: 2, shopCount: 2 },
];

const h = vi.hoisted(() => ({
  canWrite: true,
  listArgs: [] as unknown[],
  total: 45,
  config: { maxShopsDefault: 3, emailEnabled: true, emailTransportConfigured: true } as Record<string, unknown>,
  saving: false,
  updateLimits: vi.fn(),
  updateConfig: vi.fn(),
}));

vi.mock('../auth/platformAccess', () => ({ useCanWrite: () => h.canWrite }));
vi.mock('../features/layout/usePageTitle', () => ({ usePageTitle: () => undefined }));
vi.mock('../services/api', () => ({
  useListOwnersQuery: (arg: unknown) => {
    h.listArgs.push(arg);
    return { data: { owners, total: h.total, page: 1, pageSize: 20 }, isLoading: false, isError: false };
  },
  useGetSystemConfigQuery: () => ({ data: h.config }),
  useUpdateSystemConfigMutation: () => [h.updateConfig, { isLoading: h.saving }],
  useUpdateUserLimitsMutation: () => [h.updateLimits, { isLoading: false }],
}));

import { OwnersPage } from './OwnersPage';

const ok = () => ({ unwrap: () => Promise.resolve({}) });
const fail = (error: string) => ({ unwrap: () => Promise.reject({ data: { error } }) });

beforeEach(() => {
  h.canWrite = true;
  h.config = { maxShopsDefault: 3, emailEnabled: true, emailTransportConfigured: true };
  h.saving = false;
  h.listArgs = [];
  h.updateLimits.mockReset().mockReturnValue(ok());
  h.updateConfig.mockReset().mockReturnValue(ok());
});
afterEach(cleanup);

const lastArg = () => h.listArgs[h.listArgs.length - 1] as { search?: string; page: number; pageSize: number };
const openEdit = (name: string) => fireEvent.click(screen.getAllByLabelText(`Edit shop limit for ${name}`)[0]);

describe('OwnersPage list', () => {
  it('renders owners and shows "At limit" only for the at-limit, non-unlimited row', () => {
    render(<OwnersPage />);
    const badgeHolders = within(screen.getByTestId('owners-cards'))
      .getAllByText('At limit')
      .map((el) => el.closest('[data-testid^="owner-card-"]')?.getAttribute('data-testid'));
    expect(badgeHolders).toEqual(['owner-card-u-lim']);
    const zero = screen.getByTestId('owner-card-u-zero');
    expect(zero.textContent).toContain('Global default');
    expect(zero.textContent).toContain('0');
    expect(screen.getByTestId('owner-card-u-unl').textContent).toContain('Unlimited');
  });

  it('hides edit controls from read-only operators', () => {
    h.canWrite = false;
    render(<OwnersPage />);
    expect(screen.queryAllByLabelText(/Edit shop limit/)).toHaveLength(0);
  });

  it('pages server-side', () => {
    render(<OwnersPage />);
    expect(screen.getByText('Page 1 of 3')).toBeTruthy();
    fireEvent.click(screen.getByText('Next'));
    expect(lastArg().page).toBe(2);
    expect(lastArg().pageSize).toBe(20);
  });

  it('debounces search into the query arg and resets to page 1', async () => {
    render(<OwnersPage />);
    fireEvent.click(screen.getByText('Next'));
    expect(lastArg().page).toBe(2);
    const input = screen.getByLabelText('Search owners by email or name');
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(lastArg().page).toBe(1);
    expect(h.listArgs.some((a) => (a as { search?: string }).search)).toBe(false);
    await waitFor(() => expect(lastArg().search).toBe('abc'));
    expect(h.listArgs.some((a) => (a as { search?: string }).search === 'ab')).toBe(false);
  });
});

describe('Edit shop limit dialog', () => {
  it('pre-selects by maxShops and shows the global default', () => {
    render(<OwnersPage />);
    openEdit('Default Dan');
    expect((screen.getByLabelText('Use global default') as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole('dialog').textContent).toContain('Global default is currently 3 shops');
    fireEvent.click(screen.getByText('Cancel'));

    openEdit('Unlimited Uma');
    expect((screen.getByLabelText('Unlimited') as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByText('Cancel'));

    openEdit('Limit Lee');
    expect((screen.getByLabelText('Custom') as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText('Custom shop limit') as HTMLInputElement).value).toBe('2');
  });

  it('notes that existing shops are unaffected when the new limit is below shopCount', () => {
    render(<OwnersPage />);
    openEdit('Unlimited Uma'); // 9 shops, global default 3
    expect(screen.getByRole('dialog').textContent).not.toContain('Existing shops are unaffected');
    fireEvent.click(screen.getByLabelText('Use global default'));
    expect(screen.getByRole('dialog').textContent).toContain('Existing shops are unaffected');
    fireEvent.click(screen.getByLabelText('Custom'));
    fireEvent.change(screen.getByLabelText('Custom shop limit'), { target: { value: '9' } });
    expect(screen.getByRole('dialog').textContent).not.toContain('Existing shops are unaffected');
    fireEvent.change(screen.getByLabelText('Custom shop limit'), { target: { value: '5' } });
    expect(screen.getByRole('dialog').textContent).toContain('Existing shops are unaffected');
  });

  it('saves "Use global default" as maxShops: null and closes', async () => {
    render(<OwnersPage />);
    openEdit('Limit Lee');
    fireEvent.click(screen.getByLabelText('Use global default'));
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Save'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(h.updateLimits).toHaveBeenCalledWith({
      userId: 'u-lim',
      updateUserLimitsRequestDto: { maxShops: null },
    });
  });

  it('saves Unlimited as -1 and Custom as the integer', async () => {
    render(<OwnersPage />);
    openEdit('Default Dan');
    fireEvent.click(screen.getByLabelText('Unlimited'));
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Save'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(h.updateLimits).toHaveBeenLastCalledWith({ userId: 'u-default', updateUserLimitsRequestDto: { maxShops: -1 } });

    openEdit('Default Dan');
    fireEvent.click(screen.getByLabelText('Custom'));
    fireEvent.change(screen.getByLabelText('Custom shop limit'), { target: { value: '7' } });
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Save'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(h.updateLimits).toHaveBeenLastCalledWith({ userId: 'u-default', updateUserLimitsRequestDto: { maxShops: 7 } });
  });

  it('rejects 0, negative, decimal and empty custom values', () => {
    render(<OwnersPage />);
    openEdit('Limit Lee');
    const save = within(screen.getByRole('dialog')).getByText('Save') as HTMLButtonElement;
    const input = screen.getByLabelText('Custom shop limit');
    for (const bad of ['0', '-1', '1.5', '']) {
      fireEvent.change(input, { target: { value: bad } });
      expect(save.disabled).toBe(true);
    }
    expect(screen.getByRole('dialog').textContent).not.toContain('Enter a whole number'); // empty: no message
    fireEvent.change(input, { target: { value: '0' } });
    expect(screen.getByRole('dialog').textContent).toContain('Enter a whole number of 1 or more.');
    fireEvent.change(input, { target: { value: '4' } });
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
  });

  it('keeps the dialog open and shows the API error on failure', async () => {
    h.updateLimits.mockReturnValue(fail('Nope, too many'));
    render(<OwnersPage />);
    openEdit('Default Dan');
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Save'));
    await waitFor(() => expect(screen.getByText('Nope, too many')).toBeTruthy());
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});

describe('Default max shops field', () => {
  const field = () => screen.getByLabelText('Default max shops') as HTMLInputElement;
  const saveBtn = () => screen.getAllByText('Save')[0] as HTMLButtonElement;

  it('shows the current value and only saves integers >= 1', async () => {
    render(<OwnersPage />);
    expect(field().value).toBe('3');
    expect(saveBtn().disabled).toBe(true); // unchanged
    for (const bad of ['0', '-2', '2.5', '']) {
      fireEvent.change(field(), { target: { value: bad } });
      expect(saveBtn().disabled).toBe(true);
    }
    fireEvent.change(field(), { target: { value: '0' } });
    expect(screen.getByText('Enter a whole number of 1 or more.')).toBeTruthy();
    fireEvent.change(field(), { target: { value: '5' } });
    expect(saveBtn().disabled).toBe(false);
    fireEvent.click(saveBtn());
    await waitFor(() =>
      expect(h.updateConfig).toHaveBeenCalledWith({ updateSystemConfigRequestDto: { maxShopsDefault: 5 } }),
    );
  });

  it('surfaces the API rejection message', async () => {
    h.updateConfig.mockReturnValue(fail('Default must be at least 1'));
    render(<OwnersPage />);
    fireEvent.change(field(), { target: { value: '5' } });
    fireEvent.click(saveBtn());
    await waitFor(() => expect(screen.getByText('Default must be at least 1')).toBeTruthy());
  });

  it('is disabled for read-only operators', () => {
    h.canWrite = false;
    render(<OwnersPage />);
    expect(field().matches(':disabled')).toBe(true);
  });
});

describe('Order emails card', () => {
  const sw = () => screen.getByRole('switch', { name: 'Order emails' }) as HTMLButtonElement;

  it('renders the current state from the query', () => {
    render(<OwnersPage />);
    expect(sw().getAttribute('aria-checked')).toBe('true');
    cleanup();
    h.config = { ...h.config, emailEnabled: false };
    render(<OwnersPage />);
    expect(sw().getAttribute('aria-checked')).toBe('false');
  });

  it('requires confirmation to turn off, and sends only emailEnabled', async () => {
    render(<OwnersPage />);
    fireEvent.click(sw());
    expect(screen.getByText(/No emails will be sent until you turn this back on/)).toBeTruthy();
    expect(h.updateConfig).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() =>
      expect(h.updateConfig).toHaveBeenCalledWith({ updateSystemConfigRequestDto: { emailEnabled: false } }),
    );
    expect(await screen.findByText('Order emails turned off.')).toBeTruthy();
    expect(screen.queryByText('Confirm')).toBeNull();
  });

  it('cancel dismisses the confirmation without a request', () => {
    render(<OwnersPage />);
    fireEvent.click(sw());
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Confirm')).toBeNull();
    expect(h.updateConfig).not.toHaveBeenCalled();
  });

  it('turns on without confirmation', async () => {
    h.config = { ...h.config, emailEnabled: false };
    render(<OwnersPage />);
    fireEvent.click(sw());
    expect(screen.queryByText('Confirm')).toBeNull();
    await waitFor(() =>
      expect(h.updateConfig).toHaveBeenCalledWith({ updateSystemConfigRequestDto: { emailEnabled: true } }),
    );
  });

  it('shows the not-configured note only when emailTransportConfigured is false', () => {
    render(<OwnersPage />);
    expect(screen.queryByText(/Email sending is not configured/)).toBeNull();
    cleanup();
    h.config = { ...h.config, emailTransportConfigured: false };
    render(<OwnersPage />);
    expect(screen.getByText(/Email sending is not configured/)).toBeTruthy();
  });

  it('disables the toggle and shows Saving... while in flight', () => {
    h.saving = true;
    render(<OwnersPage />);
    expect(sw().disabled).toBe(true);
    expect(screen.getAllByText('Saving...').length).toBeGreaterThan(0);
  });

  it('shows the server error and keeps the last known-good state on failure', async () => {
    h.config = { ...h.config, emailEnabled: false };
    h.updateConfig.mockReturnValue(fail('Email service unavailable'));
    render(<OwnersPage />);
    fireEvent.click(sw());
    await waitFor(() => expect(screen.getByText('Email service unavailable')).toBeTruthy());
    expect(sw().getAttribute('aria-checked')).toBe('false');
  });

  it('is disabled for read-only operators', () => {
    h.canWrite = false;
    render(<OwnersPage />);
    expect(sw().matches(':disabled')).toBe(true);
  });
});
