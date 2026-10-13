import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetPlansQuery, useCreatePlanMutation } from '../services/api';
import { apiErrorMessage } from '../utils/apiError';
import type { PlanResponse } from '../services/api';
import { LoadingScreen } from '../components/ui/LoadingScreen';

export function PlansPage() {
  const { data, isLoading, isError } = useGetPlansQuery();
  const [createPlan, { isLoading: isCreating }] = useCreatePlanMutation();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleCreate() {
    if (!newName.trim() || !newKey.trim()) {
      setCreateError('Name and internal key are required');
      return;
    }
    setCreateError(null);
    try {
      await createPlan({
        createPlanRequest: { name: newName.trim(), internalKey: newKey.trim() },
      }).unwrap();
      setShowCreate(false);
      setNewName('');
      setNewKey('');
    } catch (err) {
      setCreateError(apiErrorMessage(err, 'Failed to create plan'));
    }
  }

  const plans: PlanResponse[] = data?.plans ?? [];

  if (isLoading) {
    return <LoadingScreen title="Loading plans" subtitle="Fetching plan definitions and pricing settings." />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-indigo-900">Plans</h1>
          <p className="text-sm text-gray-500 mt-0.5">{plans.length} plan{plans.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + New Plan
        </button>
      </div>

      {showCreate && (
        <div className="glass-card p-5 mb-4 space-y-4">
          <p className="text-sm font-medium text-gray-700">Create New Plan</p>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Pro"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Internal Key</label>
            <input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="e.g. pro (lowercase, stable)"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          {createError && <p className="text-red-500 text-sm">{createError}</p>}
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isCreating ? 'Creating…' : 'Create'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isError && (
        <div className="glass-card p-12 text-center text-sm text-red-500">Failed to load plans.</div>
      )}

      {!isError && plans.length === 0 && (
        <div className="glass-card p-12 text-center text-sm text-gray-500">
          No plans yet. Create one above.
        </div>
      )}

      {!isError && plans.length > 0 && (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/30">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Default</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Visible</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Limits</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Order</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-white/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-indigo-900">{plan.name}</td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">{plan.internalKey}</td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    {plan.isDefault && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Default</span>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plan.isVisible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {plan.isVisible ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs hidden md:table-cell">
                    {plan.limits.map((l) => `${l.key}: ${l.value === -1 ? '∞' : l.value}`).join(', ') || '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 hidden md:table-cell">{plan.sortOrder}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        to={`/plans/${plan.id}`}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/plans/${plan.id}/pricing`}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                      >
                        Pricing
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
