import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetPlanQuery, useUpdatePlanMutation } from '../services/api';
import type { PlanLimitResponse } from '../services/api';
import { LoadingScreen } from '../components/ui/LoadingScreen';

const LIMIT_KEYS = ['ORDERS_PER_MONTH', 'STAFF_ACCOUNTS'];

export function EditPlanPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetPlanQuery({ planId: planId! });
  const [updatePlan, { isLoading: isSaving }] = useUpdatePlanMutation();

  const [name, setName] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [limits, setLimits] = useState<PlanLimitResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.plan) {
      setName(data.plan.name);
      setIsVisible(data.plan.isVisible);
      setSortOrder(data.plan.sortOrder);
      setLimits(data.plan.limits);
    }
  }, [data]);

  function addLimit() {
    setLimits((prev) => [...prev, { key: LIMIT_KEYS[0], value: 0 }]);
  }

  function removeLimit(idx: number) {
    setLimits((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateLimitKey(idx: number, key: string) {
    setLimits((prev) => prev.map((l, i) => (i === idx ? { ...l, key } : l)));
  }

  function updateLimitValue(idx: number, value: number) {
    setLimits((prev) => prev.map((l, i) => (i === idx ? { ...l, value } : l)));
  }

  async function handleSave() {
    setError(null);
    setSaved(false);
    try {
      await updatePlan({
        planId: planId!,
        updatePlanRequest: { name, isVisible, sortOrder, limits },
      }).unwrap();
      setSaved(true);
    } catch (err: any) {
      setError(err?.data?.error ?? 'Failed to save plan');
    }
  }

  if (isLoading) return <LoadingScreen title="Loading plan" subtitle="Fetching plan configuration and limits." />;
  if (isError || !data) return (
    <div className="glass-card p-12 text-center text-sm text-red-500">Failed to load plan.</div>
  );

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/plans')}
          className="text-sm text-gray-500 hover:text-indigo-600 mb-2 inline-block transition-colors"
        >
          ← Plans
        </button>
        <h1 className="text-2xl font-semibold text-indigo-900">Edit Plan</h1>
      </div>

      <div className="glass-card p-6 space-y-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Plan name"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Internal Key (read-only)</label>
          <p className="text-gray-500 font-mono text-sm px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">{data.plan.internalKey}</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isVisible"
            checked={isVisible}
            onChange={(e) => setIsVisible(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="isVisible" className="text-sm text-gray-700">Visible in plan selector</label>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sort Order</label>
          <input
            type="number"
            value={String(sortOrder)}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Limits</p>
            <button
              onClick={addLimit}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              + Add Limit
            </button>
          </div>
          {limits.length === 0 && (
            <p className="text-gray-400 text-xs">No limits — plan is unrestricted.</p>
          )}
          {limits.map((limit, idx) => (
            <div key={idx} className="flex gap-3 items-center">
              <select
                value={limit.key}
                onChange={(e) => updateLimitKey(idx, e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {LIMIT_KEYS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              <input
                type="number"
                value={limit.value}
                onChange={(e) => updateLimitValue(idx, Number(e.target.value))}
                min="-1"
                className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                onClick={() => removeLimit(idx)}
                className="text-red-500 hover:text-red-700 text-xs font-medium transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
          <p className="text-gray-400 text-xs">-1 = unlimited</p>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {saved && <p className="text-green-600 text-sm">Saved successfully.</p>}

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
