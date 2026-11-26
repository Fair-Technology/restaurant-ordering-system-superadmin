import { useEffect, useState } from 'react';
import { usePageTitle } from '../features/layout/usePageTitle';
import { useGetSystemConfigQuery, useUpdateSystemConfigMutation } from '../services/api';
import { apiErrorMessage } from '../utils/apiError';
import { Loader2 } from 'lucide-react';
import { WriteFieldset } from '../auth/WriteOnly';

function OrderEmailsSection() {
  const { data: config } = useGetSystemConfigQuery();
  const [updateSystemConfig, { isLoading: isSaving }] = useUpdateSystemConfigMutation();
  const [confirmingOff, setConfirmingOff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!success) return;
    const id = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(id);
  }, [success]);

  // Always derived from the server value, so a failed PATCH leaves the switch at its last known-good state.
  const enabled = config?.emailEnabled === true;

  const save = async (next: boolean) => {
    setError(null);
    setSuccess(null);
    try {
      await updateSystemConfig({ updateSystemConfigRequestDto: { emailEnabled: next } }).unwrap();
      setConfirmingOff(false);
      setSuccess(next ? 'Order emails turned on.' : 'Order emails turned off.');
    } catch (err) {
      setConfirmingOff(false);
      setError(apiErrorMessage(err, 'Could not update order emails. Please try again.'));
    }
  };

  const onToggle = () => {
    if (enabled) {
      setError(null);
      setSuccess(null);
      setConfirmingOff(true);
    } else {
      void save(true);
    }
  };

  return (
    <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 id="order-emails-label" className="text-sm font-semibold text-indigo-900">
            Order emails
          </h2>
          <div className="flex items-center gap-2">
            {isSaving && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving...
              </span>
            )}
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-labelledby="order-emails-label"
              onClick={onToggle}
              disabled={isSaving || config === undefined}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
                enabled ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          When off, diners and restaurants get no emails: order confirmations, invoices, order-waiting alerts, vouchers
          and warnings.
        </p>
        {confirmingOff && (
          <div role="alert" className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
            <p>Turn off order emails? No emails will be sent until you turn this back on.</p>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => void save(false)}
                disabled={isSaving}
                className="px-3 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmingOff(false)}
                disabled={isSaving}
                className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      {config?.emailTransportConfigured === false && (
        <p role="note" className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
          Email sending is not configured in this environment, so nothing will be sent even if this switch is on.
        </p>
      )}
      {success && (
        <p role="status" className="text-xs text-green-600 mt-2">
          {success}
        </p>
      )}
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </section>
  );
}

const MIN_HORIZON_DAYS = 1;
const MAX_HORIZON_DAYS = 6;

function parseHorizonDays(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const n = Number(value);
  return n >= MIN_HORIZON_DAYS && n <= MAX_HORIZON_DAYS ? n : null;
}

function OrderAheadLimitSection() {
  const { data: config } = useGetSystemConfigQuery();
  const [updateSystemConfig, { isLoading: isSaving }] = useUpdateSystemConfigMutation();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!success) return;
    const id = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(id);
  }, [success]);

  const current = config?.scheduleHorizonDays;
  const value = draft ?? (current !== undefined ? String(current) : '');
  const parsed = parseHorizonDays(value);
  const invalid = value !== '' && parsed === null;
  const canSave = parsed !== null && parsed !== current && !isSaving;

  const save = async () => {
    if (parsed === null) return;
    setError(null);
    setSuccess(null);
    try {
      await updateSystemConfig({ updateSystemConfigRequestDto: { scheduleHorizonDays: parsed } }).unwrap();
      setDraft(null);
      setSuccess('Order ahead limit updated.');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the order ahead limit. Please try again.'));
    }
  };

  return (
    <section>
        <h2 className="text-sm font-semibold text-indigo-900 mb-3">Order ahead limit</h2>
        <label htmlFor="order-ahead-limit" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
          Order ahead limit (days)
        </label>
        <div className="flex items-center gap-2">
          <input
            id="order-ahead-limit"
            type="number"
            min={1}
            max={6}
            step={1}
            inputMode="numeric"
            value={value}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
              setSuccess(null);
            }}
            aria-invalid={invalid}
            className="w-24 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            onClick={save}
            disabled={!canSave}
            className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          {isSaving && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving...
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          The furthest day a diner can book a collection or delivery order for. The diner&apos;s card is only held, not
          charged, until the order is due — and card holds generally last about 7 days, so the limit can&apos;t go above
          6 days.
        </p>
        <p className="text-sm text-gray-500 mt-1">Changing this does not affect orders already booked.</p>
      {invalid && <p className="text-xs text-red-500 mt-1">Enter a whole number from 1 to 6.</p>}
      {success && (
        <p role="status" className="text-xs text-green-600 mt-2">
          {success}
        </p>
      )}
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </section>
  );
}

export function SettingsPage() {
  usePageTitle('Settings');
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-indigo-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform-wide switches and limits that apply to every restaurant.</p>
      </div>

      <div className="glass-card p-6">
        <WriteFieldset className="flex flex-col gap-6">
          <OrderEmailsSection />
          <hr className="border-white/40" />
          <OrderAheadLimitSection />
        </WriteFieldset>
      </div>
    </div>
  );
}
