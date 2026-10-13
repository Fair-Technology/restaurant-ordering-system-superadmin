import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetPlanPricingQuery, useGetPlanQuery, useSetPlanPricingMutation } from '../services/api';
import { apiErrorMessage } from '../utils/apiError';
import type { PlanPricingResponse } from '../services/api';
import { LoadingScreen } from '../components/ui/LoadingScreen';

const CURRENCIES = ['EUR', 'AUD', 'USD', 'GBP', 'NZD', 'CAD'];

function formatCents(cents: number) {
  return (cents / 100).toFixed(2);
}

interface PricingRowProps {
  planId: string;
  currency: string;
  existing: PlanPricingResponse | undefined;
  isFree: boolean;
}

function PricingRow({ planId, currency, existing, isFree }: PricingRowProps) {
  const [monthly, setMonthly] = useState(existing ? formatCents(existing.monthlyAmountCents) : '0.00');
  const [yearly, setYearly] = useState(existing ? formatCents(existing.yearlyAmountCents) : '0.00');
  const [monthlyPriceId, setMonthlyPriceId] = useState(existing?.billingPriceIdMonthly ?? '');
  const [yearlyPriceId, setYearlyPriceId] = useState(existing?.billingPriceIdYearly ?? '');
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const [setPricing] = useSetPlanPricingMutation();

  // Sync if existing data loads after mount (adjusted during render, not in an effect).
  const [syncedExisting, setSyncedExisting] = useState(existing);
  if (existing !== syncedExisting) {
    setSyncedExisting(existing);
    if (existing) {
      setMonthly(formatCents(existing.monthlyAmountCents));
      setYearly(formatCents(existing.yearlyAmountCents));
      setMonthlyPriceId(existing.billingPriceIdMonthly ?? '');
      setYearlyPriceId(existing.billingPriceIdYearly ?? '');
    }
  }

  async function handleSave() {
    const monthlyVal = Math.round(Number(monthly) * 100);
    const yearlyVal = Math.round(Number(yearly) * 100);
    if (isNaN(monthlyVal) || monthlyVal < 0 || isNaN(yearlyVal) || yearlyVal < 0) {
      setStatus('error');
      setErrorMsg('Invalid amount');
      return;
    }
    setStatus('saving');
    setErrorMsg('');
    try {
      await setPricing({
        planId,
        setPlanPricingRequest: {
          currency,
          monthlyAmountCents: monthlyVal,
          yearlyAmountCents: yearlyVal,
          billingPriceIdMonthly: monthlyPriceId.trim() || null,
          billingPriceIdYearly: yearlyPriceId.trim() || null,
        },
      }).unwrap();
      setStatus('saved');
      setExpanded(false);
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setStatus('error');
      setErrorMsg(apiErrorMessage(err, 'Failed to save'));
    }
  }

  return (
    <div className="border-b border-white/20 last:border-0">
      {/* Summary row */}
      <div className="flex items-center gap-4 px-6 py-3 hover:bg-white/10 transition-colors">
        <span className="w-14 font-medium text-indigo-900 text-sm">{currency}</span>
        <span className="flex-1 text-sm text-gray-600">
          {isFree ? (
            <span className="text-gray-400">Free</span>
          ) : (
            <>
              <span className="font-mono">{monthly}</span>
              <span className="text-gray-400 mx-1">/mo</span>
              {parseFloat(yearly) > 0 && (
                <>
                  <span className="font-mono">{yearly}</span>
                  <span className="text-gray-400 mx-1">/yr</span>
                </>
              )}
            </>
          )}
        </span>
        {status === 'saved' && (
          <span className="text-xs text-green-600 font-medium">Saved</span>
        )}
        {!isFree && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            {expanded ? 'Cancel' : 'Edit'}
          </button>
        )}
      </div>

      {/* Expanded edit form */}
      {expanded && (
        <div className="px-6 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Monthly Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Yearly Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={yearly}
              onChange={(e) => setYearly(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Stripe Price ID (Monthly)</label>
            <input
              value={monthlyPriceId}
              onChange={(e) => setMonthlyPriceId(e.target.value)}
              placeholder="price_xxx"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Stripe Price ID (Yearly)</label>
            <input
              value={yearlyPriceId}
              onChange={(e) => setYearlyPriceId(e.target.value)}
              placeholder="price_xxx"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          {status === 'error' && (
            <p className="sm:col-span-2 text-sm text-red-500">{errorMsg}</p>
          )}
          <div className="sm:col-span-2 flex gap-3">
            <button
              onClick={handleSave}
              disabled={status === 'saving'}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {status === 'saving' ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PlanPricingPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { data: planData } = useGetPlanQuery({ planId: planId! });
  const { data: pricingData, isLoading } = useGetPlanPricingQuery({ planId: planId! });

  const pricing: PlanPricingResponse[] = Array.isArray(pricingData) ? pricingData : [];
  const pricingByCurrency = Object.fromEntries(pricing.map((p) => [p.currency.toUpperCase(), p]));
  const isFree = planData?.plan?.isDefault ?? false;

  if (isLoading || !planData) {
    return <LoadingScreen title="Loading pricing" subtitle="Fetching plan details and pricing by currency." />;
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/plans')}
          className="text-sm text-gray-500 hover:text-indigo-600 mb-2 inline-block transition-colors"
        >
          ← Plans
        </button>
        <h1 className="text-2xl font-semibold text-indigo-900">
          Pricing — {planData?.plan?.name ?? planId}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Set monthly and yearly prices per currency.
          {isFree && ' Free plan pricing is locked at 0.'}
        </p>
      </div>

      <div className="glass-card overflow-hidden">
        {CURRENCIES.map((currency) => (
          <PricingRow
            key={currency}
            planId={planId!}
            currency={currency}
            existing={pricingByCurrency[currency]}
            isFree={isFree}
          />
        ))}
      </div>
    </div>
  );
}
