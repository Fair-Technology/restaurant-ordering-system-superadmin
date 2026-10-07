import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetShopSubscriptionQuery,
  useOverrideShopSubscriptionMutation,
  useSetLimitOverrideMutation,
  useClearLimitOverrideMutation,
  useGetPlansQuery,
} from '../services/api';
import { LoadingScreen } from '../components/ui/LoadingScreen';

const STATUS_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  past_due: 'bg-yellow-100 text-yellow-700',
  canceled: 'bg-orange-100 text-orange-700',
  expired: 'bg-red-100 text-red-600',
};

const LIMIT_KEYS = ['ORDERS_PER_MONTH', 'STAFF_ACCOUNTS'] as const;

// A date-only input means "through the end of that day" in the superadmin's local time.
function endOfDayIso(date: string): string {
  return new Date(`${date}T23:59:59`).toISOString();
}

function serverError(err: unknown, fallback: string): string {
  const message = (err as { data?: { error?: unknown } } | null)?.data?.error;
  return typeof message === 'string' ? message : fallback;
}

function limitLabel(value: number): string {
  return value === -1 ? 'unlimited' : String(value);
}

export function ShopSubscriptionPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, isFetching } = useGetShopSubscriptionQuery({ shopId: shopId! });
  const { data: plansData } = useGetPlansQuery();
  const [override, { isLoading: isOverriding }] = useOverrideShopSubscriptionMutation();

  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [overrideError, setOverrideError] = useState<string | null>(null);
  // Same as the limit buttons: the card changes only after the refetch lands.
  const [overrideSuccess, setOverrideSuccess] = useState(false);
  const applyingOverride = isOverriding || (overrideSuccess && isFetching);

  const [setLimitOverride, { isLoading: isSettingLimit }] = useSetLimitOverrideMutation();
  const [clearLimitOverride, { isLoading: isClearingLimit }] = useClearLimitOverrideMutation();
  const [limitKey, setLimitKey] = useState<(typeof LIMIT_KEYS)[number]>('ORDERS_PER_MONTH');
  const [limitValue, setLimitValue] = useState('');
  const [limitReason, setLimitReason] = useState('');
  const [limitExpiresAt, setLimitExpiresAt] = useState('');
  const [limitError, setLimitError] = useState<string | null>(null);
  // The card only changes once the subscription refetch lands (a few seconds after
  // the save itself), so the save counts as in progress until then.
  const [limitDone, setLimitDone] = useState<'set' | 'clear' | null>(null);
  const settingLimit = isSettingLimit || (limitDone === 'set' && isFetching);
  const clearingLimit = isClearingLimit || (limitDone === 'clear' && isFetching);

  async function handleOverride() {
    setOverrideError(null);
    setOverrideSuccess(false);
    if (!selectedPlanId) {
      setOverrideError('Please select a plan');
      return;
    }
    if (!reason.trim()) {
      setOverrideError('Override reason is required');
      return;
    }
    try {
      await override({
        shopId: shopId!,
        overrideRequest: {
          planId: selectedPlanId,
          overrideReason: reason.trim(),
          overrideExpiresAt: expiresAt ? endOfDayIso(expiresAt) : null,
        },
      }).unwrap();
      setOverrideSuccess(true);
      setReason('');
      setExpiresAt('');
    } catch (err: any) {
      setOverrideError(err?.data?.error ?? 'Failed to apply override');
    }
  }

  async function handleSetLimit() {
    setLimitError(null);
    setLimitDone(null);
    const value = Number(limitValue);
    if (limitValue.trim() === '' || !Number.isInteger(value) || value < -1) {
      setLimitError('Enter a whole number, -1 or higher');
      return;
    }
    if (!limitReason.trim()) {
      setLimitError('Reason is required');
      return;
    }
    try {
      await setLimitOverride({
        shopId: shopId!,
        body: {
          limits: [{ key: limitKey, value }],
          reason: limitReason.trim(),
          expiresAt: limitExpiresAt ? endOfDayIso(limitExpiresAt) : null,
        },
      }).unwrap();
      setLimitDone('set');
      setLimitValue('');
      setLimitReason('');
      setLimitExpiresAt('');
    } catch (err) {
      setLimitError(serverError(err, 'Failed to set limit override'));
    }
  }

  async function handleClearLimit() {
    setLimitError(null);
    setLimitDone(null);
    try {
      await clearLimitOverride({ shopId: shopId! }).unwrap();
      setLimitDone('clear');
    } catch (err) {
      setLimitError(serverError(err, 'Failed to remove limit override'));
    }
  }

  if (isLoading) return <LoadingScreen title="Loading subscription" subtitle="Fetching current plan and billing status." />;
  if (isError || !data) return (
    <div className="glass-card p-12 text-center text-sm text-red-500">Failed to load subscription.</div>
  );

  const { subscription, plan, entitlements } = data;
  const plans = plansData?.plans ?? [];
  const inForcePlan = plans.find((p) => p.id === entitlements.planId);
  const limitOverride = subscription.limitOverride ?? null;

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-500 hover:text-indigo-600 mb-2 inline-block transition-colors"
        >
          ← All Shops
        </button>
        <h1 className="text-2xl font-semibold text-indigo-900">Subscription — Shop {shopId}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Current subscription */}
        <div className="glass-card p-5 space-y-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Subscription</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Plan</span>
              <span className="text-indigo-900 font-medium">{plan?.name ?? subscription.planId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">In force</span>
              <span className="text-indigo-900 font-medium">
                {inForcePlan?.name ?? entitlements.planId}
                {entitlements.planOverrideExpired && (
                  <span className="ml-2 text-xs font-normal text-red-600">(override expired)</span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Status</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[subscription.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {subscription.status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Source</span>
              <span className="text-gray-700 text-sm">{subscription.planSource}</span>
            </div>
            {subscription.billingInterval && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Billing Interval</span>
                <span className="text-gray-700 text-sm">{subscription.billingInterval}</span>
              </div>
            )}
            {subscription.currentPeriodEnd && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Period End</span>
                <span className="text-gray-700 text-sm">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
              </div>
            )}
            {subscription.scheduledChange && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Scheduled change</span>
                <span className="text-gray-700 text-sm">
                  {plans.find((p) => p.id === subscription.scheduledChange!.planId)?.name ?? subscription.scheduledChange.planId}
                  {' on '}
                  {new Date(subscription.scheduledChange.effectiveAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {subscription.paymentFailedAt && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Payment failed at</span>
                <span className="text-yellow-700 text-sm">{new Date(subscription.paymentFailedAt).toLocaleString()}</span>
              </div>
            )}
            {entitlements.graceEndsAt && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Grace ends</span>
                <span className="text-gray-700 text-sm">{new Date(entitlements.graceEndsAt).toLocaleString()}</span>
              </div>
            )}
            {entitlements.droppedForNonPayment && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Dropped for non-payment</span>
                <span className="text-red-600 text-sm">Yes, on the default plan</span>
              </div>
            )}
            {subscription.billingCustomerId && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Billing Customer</span>
                <span className="text-gray-500 font-mono text-xs">{subscription.billingCustomerId.slice(0, 12)}…</span>
              </div>
            )}
            {subscription.planSource === 'superadmin_override' && (
              <div className="pt-2 border-t border-white/30 space-y-2">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Override Info</p>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">By</span>
                  <span className="text-gray-500 font-mono text-xs">{subscription.overriddenBy}</span>
                </div>
                {subscription.overrideReason && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Reason</span>
                    <span className="text-gray-700 text-sm max-w-48 text-right">{subscription.overrideReason}</span>
                  </div>
                )}
                {subscription.overrideExpiresAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Expires</span>
                    <span className="text-gray-700 text-sm">{new Date(subscription.overrideExpiresAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Override form */}
        <div className="glass-card p-5 space-y-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Manual Override</p>

          {subscription.status === 'active' && (
            <p className="text-yellow-700 text-xs bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
              Warning: this shop has an active paid subscription. Overriding will change its plan.
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Plan</label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">Select a plan…</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.internalKey})</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reason (required)</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Trial extension for partner"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expires At (optional)</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {overrideError && <p className="text-red-500 text-sm">{overrideError}</p>}
          {overrideSuccess && !applyingOverride && <p className="text-green-600 text-sm">Override applied successfully.</p>}

          <button
            onClick={handleOverride}
            disabled={applyingOverride}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {applyingOverride ? 'Applying…' : 'Apply Override'}
          </button>
        </div>

        {/* Limit override */}
        <div className="glass-card p-5 space-y-4 lg:col-span-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Limit Override</p>

          {limitOverride ? (
            <div className="space-y-2 border border-white/30 rounded-lg px-3 py-3">
              {limitOverride.limits.map((l) => (
                <div key={l.key} className="flex justify-between">
                  <span className="text-gray-500 text-sm font-mono">{l.key}</span>
                  <span className="text-gray-700 text-sm">{limitLabel(l.value)}</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Reason</span>
                <span className="text-gray-700 text-sm max-w-64 text-right">{limitOverride.reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Expires</span>
                <span className="text-gray-700 text-sm">
                  {limitOverride.expiresAt ? new Date(limitOverride.expiresAt).toLocaleString() : 'Until removed'}
                </span>
              </div>
              {!entitlements.limitOverrideActive && (
                <p className="text-xs text-red-600">This override has expired and is no longer applied.</p>
              )}
              <button
                onClick={handleClearLimit}
                disabled={clearingLimit || settingLimit}
                className="border border-red-300 text-red-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {clearingLimit ? 'Removing…' : 'Remove'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No limit override. This restaurant follows its plan.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Limit</label>
              <select
                value={limitKey}
                onChange={(e) => setLimitKey(e.target.value as (typeof LIMIT_KEYS)[number])}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {LIMIT_KEYS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Value (-1 = unlimited)</label>
              <input
                type="number"
                min={-1}
                step={1}
                value={limitValue}
                onChange={(e) => setLimitValue(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reason (required)</label>
              <input
                value={limitReason}
                onChange={(e) => setLimitReason(e.target.value)}
                placeholder="e.g. Opening week"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expires At (optional)</label>
              <input
                type="date"
                value={limitExpiresAt}
                onChange={(e) => setLimitExpiresAt(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          {limitError && <p className="text-red-500 text-sm">{limitError}</p>}
          {limitDone && !settingLimit && !clearingLimit && (
            <p className="text-green-600 text-sm">
              {limitDone === 'set' ? 'Limit override saved.' : 'Limit override removed.'}
            </p>
          )}

          <button
            onClick={handleSetLimit}
            disabled={settingLimit || clearingLimit}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {settingLimit ? 'Saving…' : 'Set Limit Override'}
          </button>
        </div>
      </div>
    </div>
  );
}
