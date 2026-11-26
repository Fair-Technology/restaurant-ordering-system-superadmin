import { useEffect, useState } from 'react';
import { usePageTitle } from '../features/layout/usePageTitle';
import {
  useGetSystemConfigQuery,
  useListOwnersQuery,
  useUpdateSystemConfigMutation,
  useUpdateUserLimitsMutation,
  type OwnerSummaryDto,
} from '../services/api';
import { apiErrorMessage } from '../utils/apiError';
import { Search, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { ScrollableTableCard } from '../components/ui/ScrollableTableCard';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { WriteFieldset } from '../auth/WriteOnly';
import { useCanWrite } from '../auth/platformAccess';
import {
  OWNERS_PAGE_SIZE,
  SEARCH_DEBOUNCE_MS,
  effectiveLabel,
  isAtLimit,
  overrideLabel,
  parsePositiveInt,
} from './owners-limits';

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

const AT_LIMIT_BADGE = 'text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded';

type LimitChoice = 'default' | 'unlimited' | 'custom';

function EditLimitDialog({
  owner,
  globalDefault,
  onClose,
}: {
  owner: OwnerSummaryDto;
  globalDefault: number | undefined;
  onClose: () => void;
}) {
  const [updateUserLimits, { isLoading: isSaving }] = useUpdateUserLimitsMutation();
  const [choice, setChoice] = useState<LimitChoice>(
    owner.maxShops === null ? 'default' : owner.maxShops === -1 ? 'unlimited' : 'custom',
  );
  const [customValue, setCustomValue] = useState(
    owner.maxShops !== null && owner.maxShops > 0 ? String(owner.maxShops) : '',
  );
  const [error, setError] = useState<string | null>(null);

  const customParsed = parsePositiveInt(customValue);
  const customInvalid = choice === 'custom' && customParsed === null;
  const showCustomError = customInvalid && customValue !== '';

  const resolved =
    choice === 'unlimited'
      ? Infinity
      : choice === 'custom'
        ? customParsed
        : (globalDefault ?? null);
  const belowCount = resolved !== null && resolved < owner.shopCount;

  const close = () => {
    if (isSaving) return;
    onClose();
  };

  const confirm = async () => {
    if (customInvalid) return;
    const maxShops = choice === 'default' ? null : choice === 'unlimited' ? -1 : customParsed;
    try {
      await updateUserLimits({
        userId: owner.userId,
        updateUserLimitsRequestDto: { maxShops },
      }).unwrap();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the shop limit. Please try again.'));
    }
  };

  const who = owner.name || owner.email || owner.userId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="owner-limit-title"
        className="glass-card bg-white p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="owner-limit-title" className="text-lg font-semibold text-indigo-900 mb-2">
          Shop limit for {who}
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Global default is currently {globalDefault ?? '…'} {globalDefault === 1 ? 'shop' : 'shops'}. This owner has{' '}
          {owner.shopCount} {owner.shopCount === 1 ? 'shop' : 'shops'}.
        </p>
        <div className="space-y-3 mb-4 text-sm text-gray-700">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="limit-choice"
              checked={choice === 'default'}
              onChange={() => setChoice('default')}
              disabled={isSaving}
            />
            Use global default
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="limit-choice"
              checked={choice === 'unlimited'}
              onChange={() => setChoice('unlimited')}
              disabled={isSaving}
            />
            Unlimited
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="limit-choice"
              checked={choice === 'custom'}
              onChange={() => setChoice('custom')}
              disabled={isSaving}
            />
            Custom
          </label>
          {choice === 'custom' && (
            <div>
              <label htmlFor="custom-limit" className="sr-only">
                Custom shop limit
              </label>
              <input
                id="custom-limit"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                disabled={isSaving}
                aria-invalid={showCustomError}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              {showCustomError && (
                <p className="text-xs text-red-500 mt-1">Enter a whole number of 1 or more.</p>
              )}
            </div>
          )}
        </div>
        {belowCount && (
          <p className="text-sm text-amber-700 mb-4">
            This is below the owner&apos;s current {owner.shopCount} {owner.shopCount === 1 ? 'shop' : 'shops'}. Existing
            shops are unaffected; only creating new shops is blocked.
          </p>
        )}
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            onClick={close}
            disabled={isSaving}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={isSaving || customInvalid}
            className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DefaultMaxShopsCard() {
  const { data: config } = useGetSystemConfigQuery();
  const [updateSystemConfig, { isLoading: isSaving }] = useUpdateSystemConfigMutation();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const current = config?.maxShopsDefault;
  const value = draft ?? (current !== undefined ? String(current) : '');
  const parsed = parsePositiveInt(value);
  const invalid = value !== '' && parsed === null;
  const canSave = parsed !== null && parsed !== current && !isSaving;

  const save = async () => {
    if (parsed === null) return;
    try {
      await updateSystemConfig({ updateSystemConfigRequestDto: { maxShopsDefault: parsed } }).unwrap();
      setDraft(null);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the default. Please try again.'));
    }
  };

  return (
    <div className="mb-4">
      <div className="glass-card px-4 py-2 flex items-center gap-3 w-full sm:w-auto sm:inline-flex">
        <WriteFieldset className="flex items-center gap-3 flex-wrap">
          <label
            htmlFor="default-max-shops"
            className="text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
          >
            Default max shops
          </label>
          <input
            id="default-max-shops"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={value}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            aria-invalid={invalid}
            className="w-20 px-3 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            onClick={save}
            disabled={!canSave}
            className="px-3 py-1 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </WriteFieldset>
        {invalid && <p className="text-xs text-red-500">Enter a whole number of 1 or more.</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}

export function OwnersPage() {
  usePageTitle('Owners');
  const canWrite = useCanWrite();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editTarget, setEditTarget] = useState<OwnerSummaryDto | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);

  const { data, isLoading, isError } = useListOwnersQuery({
    search: debouncedSearch || undefined,
    page,
    pageSize: OWNERS_PAGE_SIZE,
  });
  const { data: config } = useGetSystemConfigQuery();

  const owners = data?.owners ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / (data?.pageSize || OWNERS_PAGE_SIZE)));

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  if (isLoading) {
    return <LoadingScreen title="Loading owners" subtitle="Fetching the latest owner list." />;
  }

  return (
    <div>
      <div className="mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-indigo-900">Owners</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data ? `${total} owners total` : ''}</p>
        </div>
      </div>

      <DefaultMaxShopsCard />

      <div className="mb-4 relative w-full sm:w-72">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 w-4 h-4 text-gray-500"
        />
        <label htmlFor="owners-search" className="sr-only">
          Search owners by email or name
        </label>
        <input
          id="owners-search"
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 pr-4 py-2 text-sm border border-white/40 rounded-lg bg-white/60 backdrop-blur focus:outline-none focus:ring-2 focus:ring-indigo-300 w-full"
        />
      </div>

      {isError && (
        <div className="glass-card p-12 text-center text-sm text-red-500">
          Failed to load owners. Please try again.
        </div>
      )}

      {!isError && owners.length === 0 && (
        <div className="glass-card p-12 text-center text-sm text-gray-500">
          {debouncedSearch ? 'No owners match your search.' : 'No owners found.'}
        </div>
      )}

      {!isError && owners.length > 0 && (
        <>
          <div className="hidden sm:block">
            <ScrollableTableCard>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/30">
                    {['Owner', 'Email', 'Override', 'Effective limit', 'Shops'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/20">
                  {owners.map((owner) => (
                    <tr key={owner.userId} className="hover:bg-white/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-indigo-900">{owner.name || '—'}</div>
                            <div className="text-xs text-gray-400 break-all">{owner.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{owner.email ?? '—'}</td>
                      <td className="px-6 py-4 text-gray-500">{overrideLabel(owner.maxShops)}</td>
                      <td className="px-6 py-4 text-gray-500">{effectiveLabel(owner.effectiveLimit)}</td>
                      <td className="px-6 py-4 text-gray-500">
                        <div className="flex items-center gap-2">
                          {owner.shopCount}
                          {isAtLimit(owner) && <span className={AT_LIMIT_BADGE}>At limit</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canWrite && (
                          <button
                            onClick={() => setEditTarget(owner)}
                            aria-label={`Edit shop limit for ${owner.name || owner.email || owner.userId}`}
                            className="inline-flex items-center py-2 text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                          >
                            Edit shop limit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollableTableCard>
          </div>

          <ul className="sm:hidden space-y-3" data-testid="owners-cards">
            {owners.map((owner) => (
              <li
                key={owner.userId}
                data-testid={`owner-card-${owner.userId}`}
                className="glass-card divide-y divide-white/30 overflow-hidden"
              >
                <div className="p-4 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <User className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span className="font-medium text-indigo-900 break-words min-w-0">{owner.name || '—'}</span>
                    {isAtLimit(owner) && <span className={AT_LIMIT_BADGE}>At limit</span>}
                  </div>
                  <div className="text-xs text-gray-500 break-all">{owner.email ?? '—'}</div>
                  <div className="text-xs text-gray-400 break-all">{owner.userId}</div>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 px-4 py-3 text-xs">
                  <dt className="text-gray-500">Override</dt>
                  <dd className="text-gray-700">{overrideLabel(owner.maxShops)}</dd>
                  <dt className="text-gray-500">Effective limit</dt>
                  <dd className="text-gray-700">{effectiveLabel(owner.effectiveLimit)}</dd>
                  <dt className="text-gray-500">Shops</dt>
                  <dd className="text-gray-700">{owner.shopCount}</dd>
                </dl>
                {canWrite && (
                  <div className="px-4 py-2">
                    <button
                      onClick={() => setEditTarget(owner)}
                      aria-label={`Edit shop limit for ${owner.name || owner.email || owner.userId}`}
                      className="inline-flex items-center py-2 text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                    >
                      Edit shop limit
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {editTarget && (
        <EditLimitDialog
          key={editTarget.userId}
          owner={editTarget}
          globalDefault={config?.maxShopsDefault}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
