// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  canWrite: true,
  shops: [] as unknown[],
  update: vi.fn(),
  detail: undefined as unknown,
  detailError: false,
}));

vi.mock('../auth/platformAccess', () => ({ useCanWrite: () => mocks.canWrite }));
vi.mock('../features/layout/usePageTitle', () => ({ usePageTitle: () => undefined }));
vi.mock('../services/api', () => ({
  useGetShopsQuery: () => ({ data: { shops: mocks.shops }, isLoading: false, isError: false }),
  useRestoreShopMutation: () => [vi.fn(), { isLoading: false }],
  useSetMissedOrdersPauseLimitMutation: () => [vi.fn(), { isLoading: false }],
  useSetShopOfflineBySuperadminMutation: () => [vi.fn(), { isLoading: false }],
  useGetShopByIdQuery: () => ({ data: mocks.detail, isError: mocks.detailError }),
  useUpdateShopMutation: () => [mocks.update, { isLoading: false }],
}));

import { ShopsPage } from './ShopsPage';

function shop(countryCode: string, address: Record<string, string>) {
  return {
    id: 's1',
    name: 'Alpha Cafe',
    slug: 'alpha',
    currency: 'EUR',
    createdAt: '2025-01-01T00:00:00Z',
    isDeleted: false,
    addressLocked: true,
    countryCode,
    address,
  };
}

const DE = shop('DE', {
  street: 'Hauptstr. 1',
  postcode: '80331',
  city: 'München',
  state: 'Bayern',
  country: 'Germany',
});
const FR = shop('FR', { street: '1 Rue X', postcode: '75001', city: 'Paris', country: 'France' });

function open(s: { countryCode: string; address: Record<string, string> }) {
  mocks.shops = [{ ...s, countryCode: undefined, address: undefined }];
  mocks.detail = { ...s, id: 's1' };
  render(
    <MemoryRouter>
      <ShopsPage />
    </MemoryRouter>,
  );
  // Table and card list both render an action; either opens the same dialog.
  fireEvent.click(screen.getAllByRole('button', { name: 'Address for Alpha Cafe' })[0]);
}

const field = (name: string) => screen.getByLabelText(name) as HTMLInputElement;

beforeEach(() => {
  mocks.detail = undefined;
  mocks.detailError = false;
  mocks.canWrite = true;
  mocks.update = vi.fn(() => ({ unwrap: () => Promise.resolve({}) }));
});
afterEach(cleanup);

describe('ShopsPage address dialog', () => {
  it('opens pre-filled with the current address', () => {
    open(DE);
    expect(screen.getByRole('dialog', { name: 'Address for Alpha Cafe' })).toBeTruthy();
    expect(field('Street').value).toBe('Hauptstr. 1');
    expect(field('Postcode').value).toBe('80331');
    expect(field('City').value).toBe('München');
    expect(field('State / region').value).toBe('Bayern');
    expect(field('Country').value).toBe('Germany');
  });

  it('shows a loading state without a form while the address loads', () => {
    mocks.shops = [{ ...DE, countryCode: undefined, address: undefined }];
    render(
      <MemoryRouter>
        <ShopsPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Address for Alpha Cafe' })[0]);
    expect(screen.getByText('Loading address...')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
  });

  it('shows an error if the address cannot be loaded', () => {
    mocks.detailError = true;
    mocks.shops = [{ ...DE, countryCode: undefined, address: undefined }];
    render(
      <MemoryRouter>
        <ShopsPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Address for Alpha Cafe' })[0]);
    expect(screen.getByText('Could not load the address. Please try again.')).toBeTruthy();
  });

  it('keeps country disabled', () => {
    open(DE);
    expect(field('Country').disabled).toBe(true);
  });

  it('requires a state when the country has a list and blocks Save', async () => {
    open(DE);
    fireEvent.change(field('State / region'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('State / region is required.')).toBeTruthy();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('blocks Save on empty street/postcode/city', () => {
    open(DE);
    fireEvent.change(field('Street'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Street is required.')).toBeTruthy();
    fireEvent.change(field('Street'), { target: { value: 'x' } });
    fireEvent.change(field('Postcode'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Postcode is required.')).toBeTruthy();
    fireEvent.change(field('Postcode'), { target: { value: '1' } });
    fireEvent.change(field('City'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('City is required.')).toBeTruthy();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('hides the state field for countries without a list', () => {
    open(FR);
    expect(screen.queryByLabelText('State / region')).toBeNull();
    expect(field('Country').value).toBe('France');
  });

  it('saves valid data without country and confirms', async () => {
    open(DE);
    fireEvent.change(field('Street'), { target: { value: '  Neue Str. 2 ' } });
    fireEvent.change(field('State / region'), { target: { value: 'Berlin' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Address saved.')).toBeTruthy();
    expect(mocks.update).toHaveBeenCalledWith({
      shopId: 's1',
      body: {
        address: { street: 'Neue Str. 2', postcode: '80331', city: 'München', state: 'Berlin' },
      },
    });
    const body = mocks.update.mock.calls[0][0].body.address;
    expect('country' in body).toBe(false);
  });

  it('omits state for countries without a list', async () => {
    open(FR);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('Address saved.');
    expect(mocks.update.mock.calls[0][0].body.address).toEqual({
      street: '1 Rue X',
      postcode: '75001',
      city: 'Paris',
    });
  });

  it('shows the server error when saving fails', async () => {
    mocks.update = vi.fn(() => ({
      unwrap: () => Promise.reject({ data: { error: 'Address is locked.' } }),
    }));
    open(DE);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByText('Address is locked.')).toBeTruthy());
    expect(screen.queryByText('Address saved.')).toBeNull();
  });

  it('falls back to a generic message without a server error', async () => {
    mocks.update = vi.fn(() => ({ unwrap: () => Promise.reject(new Error('boom')) }));
    open(DE);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(
      await screen.findByText('Could not save the address. Please try again.'),
    ).toBeTruthy();
  });

  it('opens read-only without write access', () => {
    mocks.canWrite = false;
    open(DE);
    expect(screen.getByRole('dialog', { name: 'Address for Alpha Cafe' })).toBeTruthy();
    for (const n of ['Street', 'Postcode', 'City', 'State / region', 'Country']) {
      expect(field(n).disabled).toBe(true);
    }
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
  });
});
