// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({
  canWrite: true,
  config: { maxShopsDefault: 3, emailEnabled: true, scheduleHorizonDays: 4, emailTransportConfigured: true } as Record<string, unknown>,
  saving: false,
  updateConfig: vi.fn(),
}));

vi.mock('../auth/platformAccess', () => ({ useCanWrite: () => h.canWrite }));
vi.mock('../features/layout/usePageTitle', () => ({ usePageTitle: () => undefined }));
vi.mock('../services/api', () => ({
  useGetSystemConfigQuery: () => ({ data: h.config }),
  useUpdateSystemConfigMutation: () => [h.updateConfig, { isLoading: h.saving }],
}));

import { SettingsPage } from './SettingsPage';

const ok = () => ({ unwrap: () => Promise.resolve({}) });
const fail = (error: string) => ({ unwrap: () => Promise.reject({ data: { error } }) });

beforeEach(() => {
  h.canWrite = true;
  h.config = { maxShopsDefault: 3, emailEnabled: true, scheduleHorizonDays: 4, emailTransportConfigured: true };
  h.saving = false;
  h.updateConfig.mockReset().mockReturnValue(ok());
});
afterEach(cleanup);

describe('Order emails card', () => {
  const sw = () => screen.getByRole('switch', { name: 'Order emails' }) as HTMLButtonElement;

  it('renders the current state from the query', () => {
    render(<SettingsPage />);
    expect(sw().getAttribute('aria-checked')).toBe('true');
    cleanup();
    h.config = { ...h.config, emailEnabled: false };
    render(<SettingsPage />);
    expect(sw().getAttribute('aria-checked')).toBe('false');
  });

  it('requires confirmation to turn off, and sends only emailEnabled', async () => {
    render(<SettingsPage />);
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
    render(<SettingsPage />);
    fireEvent.click(sw());
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Confirm')).toBeNull();
    expect(h.updateConfig).not.toHaveBeenCalled();
  });

  it('turns on without confirmation', async () => {
    h.config = { ...h.config, emailEnabled: false };
    render(<SettingsPage />);
    fireEvent.click(sw());
    expect(screen.queryByText('Confirm')).toBeNull();
    await waitFor(() =>
      expect(h.updateConfig).toHaveBeenCalledWith({ updateSystemConfigRequestDto: { emailEnabled: true } }),
    );
  });

  it('shows the not-configured note only when emailTransportConfigured is false', () => {
    render(<SettingsPage />);
    expect(screen.queryByText(/Email sending is not configured/)).toBeNull();
    cleanup();
    h.config = { ...h.config, emailTransportConfigured: false };
    render(<SettingsPage />);
    expect(screen.getByText(/Email sending is not configured/)).toBeTruthy();
  });

  it('disables the toggle and shows Saving... while in flight', () => {
    h.saving = true;
    render(<SettingsPage />);
    expect(sw().disabled).toBe(true);
    expect(screen.getAllByText('Saving...').length).toBeGreaterThan(0);
  });

  it('shows the server error and keeps the last known-good state on failure', async () => {
    h.config = { ...h.config, emailEnabled: false };
    h.updateConfig.mockReturnValue(fail('Email service unavailable'));
    render(<SettingsPage />);
    fireEvent.click(sw());
    await waitFor(() => expect(screen.getByText('Email service unavailable')).toBeTruthy());
    expect(sw().getAttribute('aria-checked')).toBe('false');
  });

  it('is disabled for read-only operators', () => {
    h.canWrite = false;
    render(<SettingsPage />);
    expect(sw().matches(':disabled')).toBe(true);
  });
});

describe('Order ahead limit card', () => {
  const field = () => screen.getByLabelText('Order ahead limit (days)') as HTMLInputElement;
  const saveBtn = () => screen.getByText('Save') as HTMLButtonElement;

  it('renders the current value', () => {
    render(<SettingsPage />);
    expect(field().value).toBe('4');
    expect(saveBtn().disabled).toBe(true); // unchanged
  });

  it('rejects 0, 7 and non-integer values', () => {
    render(<SettingsPage />);
    for (const bad of ['0', '7', '2.5']) {
      fireEvent.change(field(), { target: { value: bad } });
      expect(saveBtn().disabled).toBe(true);
      expect(screen.getByText('Enter a whole number from 1 to 6.')).toBeTruthy();
    }
  });

  it('saves a valid value and shows success', async () => {
    render(<SettingsPage />);
    fireEvent.change(field(), { target: { value: '2' } });
    expect(saveBtn().disabled).toBe(false);
    fireEvent.click(saveBtn());
    await waitFor(() =>
      expect(h.updateConfig).toHaveBeenCalledWith({ updateSystemConfigRequestDto: { scheduleHorizonDays: 2 } }),
    );
    expect(await screen.findByText('Order ahead limit updated.')).toBeTruthy();
  });

  it('shows the server error when the mutation rejects', async () => {
    h.updateConfig.mockReturnValue(fail('Horizon too large'));
    render(<SettingsPage />);
    fireEvent.change(field(), { target: { value: '2' } });
    fireEvent.click(saveBtn());
    await waitFor(() => expect(screen.getByText('Horizon too large')).toBeTruthy());
  });
});
