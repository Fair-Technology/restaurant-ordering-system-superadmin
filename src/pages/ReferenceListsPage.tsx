import { type ReactNode, useState } from 'react';
import { useGetReferenceListsQuery, useUpdateReferenceListsMutation } from '../services/api';
import type {
  FulfilmentModeKey,
  ReferenceEntry,
  ReferenceListsResponse,
  ReferenceListsUpdateBody,
  TaxRateRowDto,
} from '../services/api';
import { LoadingScreen } from '../components/ui/LoadingScreen';

const FULFILMENT_MODES: FulfilmentModeKey[] = ['collection', 'delivery', 'dine_in'];
const MODE_LABELS: Record<FulfilmentModeKey, string> = {
  collection: 'Collection',
  delivery: 'Delivery',
  dine_in: 'Dine-in',
};

function toUpdateBody(data: ReferenceListsResponse): ReferenceListsUpdateBody {
  return {
    allergens: data.allergens,
    additives: data.additives,
    taxClasses: data.taxClasses,
    defaultTaxClassId: data.defaultTaxClassId,
    taxRates: data.taxRates,
  };
}

function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: { error?: string } }).data;
    if (data?.error) return data.error;
  }
  return fallback;
}

export function ReferenceListsPage() {
  const [countryCode, setCountryCode] = useState('DE');
  const isValidCode = countryCode.length === 2;
  const { data, isLoading, isError } = useGetReferenceListsQuery(
    { countryCode },
    { skip: !isValidCode },
  );

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-indigo-900">Food &amp; Tax Lists</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Allergens, additives and tax classes are platform-wide, one list per country.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Country</label>
          <input
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value.toUpperCase().slice(0, 2))}
            maxLength={2}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-20 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>

      {!isValidCode ? (
        <div className="glass-card p-12 text-center text-sm text-gray-500">Enter a two-letter country code.</div>
      ) : isLoading ? (
        <LoadingScreen title="Loading lists" subtitle="Fetching allergens, additives and tax rates." />
      ) : isError || !data ? (
        <div className="glass-card p-12 text-center text-sm text-red-500">Failed to load lists.</div>
      ) : (
        <ReferenceListsEditor key={countryCode} countryCode={countryCode} data={data} />
      )}
    </div>
  );
}

function ReferenceListsEditor({
  countryCode,
  data,
}: {
  countryCode: string;
  data: ReferenceListsResponse;
}) {
  const [updateReferenceLists, { isLoading: isSaving }] = useUpdateReferenceListsMutation();
  // Initialised once from the loaded data (this component remounts, via the `key={countryCode}`
  // above, whenever the country changes) so edits never fight a background refetch.
  const [draft, setDraft] = useState<ReferenceListsUpdateBody>(() => toUpdateBody(data));
  const [originalCounts] = useState(() => ({
    allergens: data.allergens.length,
    additives: data.additives.length,
    taxClasses: data.taxClasses.length,
  }));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function addRow<K extends 'allergens' | 'additives' | 'taxClasses'>(
    list: K,
    row: ReferenceListsUpdateBody[K][number],
  ) {
    setSaved(false);
    setDraft((prev) => ({ ...prev, [list]: [...prev[list], row] }));
  }

  function updateRow<K extends 'allergens' | 'additives' | 'taxClasses'>(
    list: K,
    idx: number,
    patch: Partial<ReferenceListsUpdateBody[K][number]>,
  ) {
    setSaved(false);
    setDraft((prev) => ({
      ...prev,
      [list]: prev[list].map((row, i) => (i === idx ? { ...row, ...patch } : row)),
    }));
  }

  function addTaxRates(rows: TaxRateRowDto[]) {
    setSaved(false);
    setDraft((prev) => ({ ...prev, taxRates: [...prev.taxRates, ...rows] }));
  }

  async function handleSave() {
    setError(null);
    setSaved(false);
    try {
      await updateReferenceLists({ countryCode, body: draft }).unwrap();
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err, 'Failed to save lists'));
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-500">
        {data.updatedAt ? `Last changed ${new Date(data.updatedAt).toLocaleString()}` : 'No changes yet.'}
      </p>

      <EntryTable
        title="Allergens"
        addLabel="Add allergen"
        rows={draft.allergens}
        firstEditableIndex={originalCounts.allergens}
        onAdd={() => addRow('allergens', { id: '', labels: { de: '', en: '' }, isActive: true })}
        onChange={(idx, patch) => updateRow('allergens', idx, patch)}
      />

      <EntryTable
        title="Additives"
        addLabel="Add additive"
        rows={draft.additives}
        firstEditableIndex={originalCounts.additives}
        onAdd={() => addRow('additives', { id: '', code: 0, labels: { de: '', en: '' }, isActive: true })}
        onChange={(idx, patch) => updateRow('additives', idx, patch)}
        extraHeader={<th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>}
        extraCell={(row, idx) => (
          <td className="px-4 py-2">
            <input
              type="number"
              value={row.code}
              onChange={(e) => updateRow('additives', idx, { code: Number(e.target.value) })}
              className="border border-gray-200 rounded px-2 py-1 text-xs w-16 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </td>
        )}
      />

      <EntryTable
        title="Tax classes"
        addLabel="Add tax class"
        rows={draft.taxClasses}
        firstEditableIndex={originalCounts.taxClasses}
        onAdd={() => addRow('taxClasses', { id: '', labels: { de: '', en: '' }, isActive: true })}
        onChange={(idx, patch) => updateRow('taxClasses', idx, patch)}
        extraHeader={<th className="text-center px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>}
        extraCell={(row) => (
          <td className="px-4 py-2 text-center">
            <input
              type="radio"
              name="defaultTaxClass"
              checked={draft.defaultTaxClassId === row.id}
              onChange={() => {
                setSaved(false);
                setDraft((prev) => ({ ...prev, defaultTaxClassId: row.id }));
              }}
              className="w-4 h-4"
            />
          </td>
        )}
      />

      <TaxRatesSection taxRates={draft.taxRates} taxClasses={draft.taxClasses} onAdd={addTaxRates} />

      <div className="glass-card px-6 py-4 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? 'Saving…' : 'Save lists'}
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {saved && <p className="text-green-600 text-sm">Saved.</p>}
      </div>
    </div>
  );
}

function EntryTable<T extends ReferenceEntry>({
  title,
  addLabel,
  rows,
  firstEditableIndex,
  onAdd,
  onChange,
  extraHeader,
  extraCell,
}: {
  title: string;
  addLabel: string;
  rows: T[];
  firstEditableIndex: number;
  onAdd: () => void;
  onChange: (idx: number, patch: Partial<T>) => void;
  extraHeader?: ReactNode;
  extraCell?: (row: T, idx: number) => ReactNode;
}) {
  const columnCount = extraHeader ? 5 : 4;

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-6 py-4 border-b border-white/30 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-indigo-900">{title}</h2>
        <button
          onClick={onAdd}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          + {addLabel}
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/30">
            <th className="text-left px-6 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">German</th>
            <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">English</th>
            {extraHeader}
            <th className="text-center px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/20">
          {rows.length === 0 && (
            <tr>
              <td colSpan={columnCount} className="px-6 py-4 text-xs text-gray-400">No entries yet.</td>
            </tr>
          )}
          {rows.map((row, idx) => {
            const idIsEditable = idx >= firstEditableIndex;
            return (
              <tr key={idx} className="hover:bg-white/20 transition-colors">
                <td className="px-6 py-2">
                  {idIsEditable ? (
                    <input
                      value={row.id}
                      onChange={(e) => onChange(idx, { id: e.target.value } as Partial<T>)}
                      placeholder="id"
                      className="border border-gray-200 rounded px-2 py-1 text-xs w-28 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  ) : (
                    <span className="font-mono text-xs text-gray-500">{row.id}</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <input
                    value={row.labels.de}
                    onChange={(e) =>
                      onChange(idx, { labels: { ...row.labels, de: e.target.value } } as Partial<T>)
                    }
                    className="border border-gray-200 rounded px-2 py-1 text-xs w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    value={row.labels.en}
                    onChange={(e) =>
                      onChange(idx, { labels: { ...row.labels, en: e.target.value } } as Partial<T>)
                    }
                    className="border border-gray-200 rounded px-2 py-1 text-xs w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </td>
                {extraCell?.(row, idx)}
                <td className="px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={row.isActive}
                    onChange={(e) => onChange(idx, { isActive: e.target.checked } as Partial<T>)}
                    className="w-4 h-4"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TaxRatesSection({
  taxRates,
  taxClasses,
  onAdd,
}: {
  taxRates: TaxRateRowDto[];
  taxClasses: ReferenceEntry[];
  onAdd: (rows: TaxRateRowDto[]) => void;
}) {
  const [taxClassId, setTaxClassId] = useState(taxClasses[0]?.id ?? '');
  const [mode, setMode] = useState<FulfilmentModeKey | 'all'>('all');
  const [pct, setPct] = useState('');
  const [startsAt, setStartsAt] = useState('');

  function handleAdd() {
    if (!taxClassId || !pct || !startsAt) return;
    const modes: FulfilmentModeKey[] = mode === 'all' ? FULFILMENT_MODES : [mode];
    const rateBasisPoints = Math.round(Number(pct) * 100);
    const effectiveFrom = new Date(startsAt).toISOString();
    onAdd(modes.map((fulfilmentMode) => ({ taxClassId, fulfilmentMode, rateBasisPoints, effectiveFrom })));
    setPct('');
    setStartsAt('');
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-6 py-4 border-b border-white/30">
        <h2 className="text-sm font-semibold text-indigo-900">Tax rates</h2>
        <p className="text-xs text-gray-500 mt-0.5">Existing rows can&rsquo;t be edited — add a new row instead.</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/30">
            <th className="text-left px-6 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
            <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
            <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
            <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Effective from</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/20">
          {taxRates.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-4 text-xs text-gray-400">No rates yet.</td>
            </tr>
          )}
          {taxRates.map((row, idx) => (
            <tr key={idx}>
              <td className="px-6 py-2 text-gray-700">
                {taxClasses.find((c) => c.id === row.taxClassId)?.labels.en ?? row.taxClassId}
              </td>
              <td className="px-4 py-2 text-gray-700">{MODE_LABELS[row.fulfilmentMode]}</td>
              <td className="px-4 py-2 text-gray-700">{(row.rateBasisPoints / 100).toFixed(2)}%</td>
              <td className="px-4 py-2 text-gray-700">{new Date(row.effectiveFrom).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="px-6 py-4 border-t border-white/30 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Class</label>
          <select
            value={taxClassId}
            onChange={(e) => setTaxClassId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {taxClasses.length === 0 && <option value="">No tax classes yet</option>}
            {taxClasses.map((c) => (
              <option key={c.id} value={c.id}>{c.labels.en || c.id}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as FulfilmentModeKey | 'all')}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="all">All three</option>
            {FULFILMENT_MODES.map((m) => (
              <option key={m} value={m}>{MODE_LABELS[m]}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Rate %</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Starts at</label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <button
          onClick={handleAdd}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors px-2 py-2"
        >
          + Add rate
        </button>
      </div>
    </div>
  );
}
