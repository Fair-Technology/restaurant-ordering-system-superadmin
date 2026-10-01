import { useState } from 'react';
import {
  useGetPlatformLegalIdentityQuery,
  useGetPlatformLegalPublicQuery,
  useUpdatePlatformLegalIdentityMutation,
  type PlatformLegalIdentityResponse,
  type PlatformLegalIdentityUpdateBody,
} from '../services/api';
import { LoadingScreen } from '../components/ui/LoadingScreen';

interface FormState {
  platformName: string;
  salesSiteUrl: string;
  operatorName: string;
  operatorAddress: string;
  operatorEmail: string;
  euAppointed: boolean;
  euName: string;
  euAddress: string;
  euEmail: string;
}

function toForm(p: PlatformLegalIdentityResponse): FormState {
  return {
    platformName: p.platformName,
    salesSiteUrl: p.salesSiteUrl ?? '',
    operatorName: p.operator.legalName,
    operatorAddress: p.operator.address,
    operatorEmail: p.operator.email,
    euAppointed: p.euRepresentative !== null,
    euName: p.euRepresentative?.name ?? '',
    euAddress: p.euRepresentative?.address ?? '',
    euEmail: p.euRepresentative?.email ?? '',
  };
}

function toBody(f: FormState): PlatformLegalIdentityUpdateBody {
  return {
    platformName: f.platformName.trim(),
    salesSiteUrl: f.salesSiteUrl.trim() === '' ? null : f.salesSiteUrl.trim(),
    operator: {
      legalName: f.operatorName.trim(),
      address: f.operatorAddress.trim(),
      email: f.operatorEmail.trim(),
    },
    euRepresentative: f.euAppointed
      ? { name: f.euName.trim(), address: f.euAddress.trim(), email: f.euEmail.trim() }
      : null,
  };
}

const inputClass =
  'w-full rounded-lg border border-white/50 bg-white/60 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400';
const labelClass = 'block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1';

export function PlatformLegalPage() {
  const { data, isLoading, isError } = useGetPlatformLegalIdentityQuery();
  const { data: publicData } = useGetPlatformLegalPublicQuery();
  const [updateIdentity, { isLoading: isSaving }] = useUpdatePlatformLegalIdentityMutation();

  // Edits live in `draft`; until the first keystroke the form shows what the server sent.
  const [draft, setDraft] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (isLoading) {
    return <LoadingScreen title="Loading legal details" subtitle="Fetching the platform operator details." />;
  }
  if (isError || !data) {
    return (
      <div className="glass-card p-12 text-center text-sm text-red-500">Failed to load the platform legal details.</div>
    );
  }

  const form = draft ?? toForm(data);

  function update(patch: Partial<FormState>) {
    setSaved(false);
    setDraft({ ...form, ...patch });
  }

  async function handleSave() {
    setError(null);
    setSaved(false);
    try {
      await updateIdentity(toBody(form)).unwrap();
      setDraft(null);
      setSaved(true);
    } catch (err) {
      const apiError = (err as { data?: { error?: string } } | undefined)?.data?.error;
      setError(apiError ?? 'Failed to save the platform legal details');
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-indigo-900">Legal</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {data.updatedAt ? `Last changed ${new Date(data.updatedAt).toLocaleString()}` : 'Not filled in yet.'} These
          details appear in every restaurant&apos;s privacy notice. Until the operator details are filled in, no
          restaurant can go live.
        </p>
      </div>

      <div className="glass-card p-6 flex flex-col gap-6">
        <section className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="platformName">Platform name</label>
            <input
              id="platformName"
              className={inputClass}
              value={form.platformName}
              onChange={(e) => update({ platformName: e.target.value })}
            />
            <p className="text-xs text-gray-400 mt-1">Shown on every storefront as &quot;Ordering by …&quot;.</p>
          </div>
          <div>
            <label className={labelClass} htmlFor="salesSiteUrl">Sales site URL (https, optional)</label>
            <input
              id="salesSiteUrl"
              className={inputClass}
              value={form.salesSiteUrl}
              onChange={(e) => update({ salesSiteUrl: e.target.value })}
              placeholder="https://"
            />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-indigo-900 mb-3">Operator</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="operatorName">Company name</label>
              <input
                id="operatorName"
                className={inputClass}
                value={form.operatorName}
                onChange={(e) => update({ operatorName: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="operatorEmail">Contact email</label>
              <input
                id="operatorEmail"
                type="email"
                className={inputClass}
                value={form.operatorEmail}
                onChange={(e) => update({ operatorEmail: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass} htmlFor="operatorAddress">Postal address</label>
              <textarea
                id="operatorAddress"
                rows={3}
                className={inputClass}
                value={form.operatorAddress}
                onChange={(e) => update({ operatorAddress: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-indigo-900 mb-3">EU representative</h2>
          <label className="flex items-center gap-2 text-sm text-gray-700 mb-3">
            <input
              type="checkbox"
              className="w-4 h-4"
              checked={form.euAppointed}
              onChange={(e) => update({ euAppointed: e.target.checked })}
            />
            Appointed
          </label>
          {form.euAppointed && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="euName">Name</label>
                <input
                  id="euName"
                  className={inputClass}
                  value={form.euName}
                  onChange={(e) => update({ euName: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="euEmail">Email</label>
                <input
                  id="euEmail"
                  type="email"
                  className={inputClass}
                  value={form.euEmail}
                  onChange={(e) => update({ euEmail: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass} htmlFor="euAddress">Address</label>
                <textarea
                  id="euAddress"
                  rows={3}
                  className={inputClass}
                  value={form.euAddress}
                  onChange={(e) => update({ euAddress: e.target.value })}
                />
              </div>
            </div>
          )}
        </section>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {saved && <p className="text-green-600 text-sm">Saved.</p>}
        </div>
      </div>

      {publicData && (
        <div className="glass-card mt-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/30 flex items-center gap-3">
            <p className="text-sm text-gray-700">
              Current data processing agreement: <span className="font-medium">{publicData.currentDpaVersion}</span>
            </p>
            {publicData.currentDpaIsDraft && (
              <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-medium">
                DRAFT – not reviewed by a lawyer
              </span>
            )}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/30">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Sub-processor</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {publicData.subProcessors.map((sp) => (
                <tr key={sp.id}>
                  <td className="px-6 py-3 font-medium text-gray-900">{sp.name}</td>
                  <td className="px-6 py-3 text-gray-700">{sp.purpose.en}</td>
                  <td className="px-6 py-3 text-gray-700">{sp.location.en}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
