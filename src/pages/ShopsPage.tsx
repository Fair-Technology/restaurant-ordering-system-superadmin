import { usePageTitle } from '../features/layout/usePageTitle';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetShopsQuery,
  useRestoreShopMutation,
  useSetMissedOrdersPauseLimitMutation,
  useSetShopOfflineBySuperadminMutation,
  type ShopSummaryDto,
} from '../services/api';
import { apiErrorMessage } from '../utils/apiError';
import { formatDate } from '../utils/date';
import {
  MISSED_ORDERS_LIMIT_OPTIONS,
  missedOrdersLimitLabel,
  missedOrdersLimitOf,
} from './missed-orders';
import { Store, ArrowRight, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getShopStatus, offlineActionLabel, SUPERADMIN_REASON_MAX, type ShopStatusKind } from './shop-status';
import { ScrollableTableCard } from '../components/ui/ScrollableTableCard';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { PAGE_SIZE, buildSuperadminOfflineRequest, countShops, filterShops, pageOf } from './shops-list';
import { useCanWrite } from '../auth/platformAccess';

const STATUS_STYLE: Record<ShopStatusKind, string> = {
  online: 'bg-green-100 text-green-700',
  'offline-owner': 'bg-amber-100 text-amber-700',
  'offline-platform': 'bg-red-100 text-red-600',
};

export function ShopsPage() {
  usePageTitle('Shops');
  const canWrite = useCanWrite();
  const { data: shops, isLoading, isError } = useGetShopsQuery();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showDeleted, setShowDeleted] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<ShopSummaryDto | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreShop, { isLoading: isRestoring }] = useRestoreShopMutation();

  const [offlineTarget, setOfflineTarget] = useState<ShopSummaryDto | null>(null);
  const [offlineReason, setOfflineReason] = useState('');
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const [setSuperadminOffline, { isLoading: isSettingOffline }] =
    useSetShopOfflineBySuperadminMutation();

  const [limitTarget, setLimitTarget] = useState<ShopSummaryDto | null>(null);
  const [limitValue, setLimitValue] = useState(3);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [setMissedOrdersPauseLimit, { isLoading: isSavingLimit }] =
    useSetMissedOrdersPauseLimitMutation();

  const { active: activeCount, deleted: deletedCount } = countShops(shops?.shops ?? []);
  const subtitle =
    showDeleted && deletedCount > 0
      ? `${activeCount} shops (${deletedCount} deleted)`
      : `${activeCount} shops total`;
  const filtered = filterShops(shops?.shops ?? [], search, showDeleted);

  const closeRestore = () => {
    if (isRestoring) return;
    setRestoreTarget(null);
    setRestoreError(null);
  };

  const confirmRestore = async () => {
    if (!restoreTarget) return;
    try {
      await restoreShop({ shopId: restoreTarget.id }).unwrap();
      setRestoreTarget(null);
      setRestoreError(null);
    } catch {
      setRestoreError('Could not restore this shop. Please try again.');
    }
  };

  const closeOffline = () => {
    if (isSettingOffline) return;
    setOfflineTarget(null);
    setOfflineReason('');
    setOfflineError(null);
  };

  const confirmOffline = async () => {
    if (!offlineTarget) return;
    const request = buildSuperadminOfflineRequest(offlineTarget, offlineReason);
    const goOffline = request.offline;
    try {
      await setSuperadminOffline({ shopId: request.shopId, body: { offline: request.offline, reason: request.reason } }).unwrap();
      setOfflineTarget(null);
      setOfflineReason('');
      setOfflineError(null);
    } catch {
      setOfflineError(
        goOffline
          ? 'Could not take this shop offline. Please try again.'
          : 'Could not bring this shop back online. Please try again.',
      );
    }
  };

  const openLimit = (shop: ShopSummaryDto) => {
    setLimitValue(missedOrdersLimitOf(shop));
    setLimitError(null);
    setLimitTarget(shop);
  };

  const closeLimit = () => {
    if (isSavingLimit) return;
    setLimitTarget(null);
    setLimitError(null);
  };

  const confirmLimit = async () => {
    if (!limitTarget) return;
    try {
      await setMissedOrdersPauseLimit({ shopId: limitTarget.id, body: { limit: limitValue } }).unwrap();
      setLimitTarget(null);
      setLimitError(null);
    } catch (err) {
      setLimitError(apiErrorMessage(err, 'Could not save. Please try again.'));
    }
  };

  const { pageItems, totalPages } = pageOf(filtered, page, PAGE_SIZE);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  if (isLoading) {
    return <LoadingScreen title="Loading shops" subtitle="Fetching the latest shop list." />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-indigo-900">All Shops</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {shops ? subtitle : ''}
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap w-full sm:w-auto">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => {
              setShowDeleted(e.target.checked);
              setPage(1);
            }}
            className="rounded border-gray-300"
          />
          Show deleted
        </label>
        <div className="relative flex-1 sm:flex-none">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <label htmlFor="shops-search" className="sr-only">
            Search shops by name
          </label>
          <input
            id="shops-search"
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-white/40 rounded-lg bg-white/60 backdrop-blur focus:outline-none focus:ring-2 focus:ring-indigo-300 w-full sm:w-56"
          />
        </div>
        </div>
      </div>

      {isError && (
        <div className="glass-card p-12 text-center text-sm text-red-500">
          Failed to load shops. Please try again.
        </div>
      )}

      {!isError && filtered.length === 0 && (
        <div className="glass-card p-12 text-center text-sm text-gray-500">
          {search ? 'No shops match your search.' : 'No shops found.'}
        </div>
      )}

      {!isError && pageItems.length > 0 && (
        <>
          <div className="hidden sm:block">
          <ScrollableTableCard>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/30">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shop
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Slug
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Currency
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Created
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {pageItems.map((shop) => {
                  const status = getShopStatus(shop);
                  return (
                  <tr
                    key={shop.id}
                    className={`hover:bg-white/20 transition-colors ${shop.isDeleted ? 'opacity-60' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        <span className="font-medium text-indigo-900">{shop.name}</span>
                        {shop.isDeleted && (
                          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                            {shop.deletedAt ? `Deleted ${formatDate(shop.deletedAt)}` : 'Deleted'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        return (
                          <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded ${STATUS_STYLE[status.kind]}`}
                              >
                                {status.label}
                              </span>
                              {status.ordersPaused && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                  Orders paused
                                </span>
                              )}
                            </div>
                            {shop.offlineBySuperadmin && shop.offlineBySuperadminReason && (
                              <span className="text-xs text-gray-500 max-w-[16rem] break-words">
                                Reason: {shop.offlineBySuperadminReason}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-gray-500 hidden sm:table-cell">{shop.slug}</td>
                    <td className="px-6 py-4 text-gray-500 hidden md:table-cell">
                      {shop.currency ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-500 hidden lg:table-cell">
                      {formatDate(shop.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2 py-1">
                        <Link
                          to={`/shops/${shop.id}/subscription`}
                          aria-label={`Subscription for ${shop.name}`}
                          className="inline-flex items-center py-2 text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                        >
                          Subscription
                        </Link>
                        <Link
                          to={`/shops/${shop.id}/usage`}
                          aria-label={`Usage for ${shop.name}`}
                          className="inline-flex items-center py-2 text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                        >
                          Usage
                        </Link>
                        <Link
                          to={`/shops/${shop.id}/activity`}
                          state={{ shopName: shop.name }}
                          aria-label={`Activity for ${shop.name}`}
                          className="inline-flex items-center gap-1 py-2 text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                        >
                          Activity
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                        {!canWrite && !shop.isDeleted && (
                          <span
                            aria-label={`${missedOrdersLimitLabel(missedOrdersLimitOf(shop))} for ${shop.name}`}
                            className="text-gray-500 text-xs font-medium"
                          >
                            {missedOrdersLimitLabel(missedOrdersLimitOf(shop))}
                          </span>
                        )}
                        {canWrite && !shop.isDeleted && (
                          <button
                            onClick={() => openLimit(shop)}
                            aria-label={`${missedOrdersLimitLabel(missedOrdersLimitOf(shop))} for ${shop.name}`}
                            className="inline-flex items-center py-2 text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                          >
                            {missedOrdersLimitLabel(missedOrdersLimitOf(shop))}
                          </button>
                        )}
                        {canWrite && !shop.isDeleted && (
                          <button
                            onClick={() => setOfflineTarget(shop)}
                            aria-label={`${offlineActionLabel(shop, status)} for ${shop.name}`}
                            className={`inline-flex items-center py-2 ${shop.offlineBySuperadmin ? 'text-green-700 hover:text-green-900' : 'text-red-600 hover:text-red-800'} text-xs font-medium transition-colors`}
                          >
                            {offlineActionLabel(shop, status)}
                          </button>
                        )}
                        {canWrite && shop.isDeleted && (
                          <button
                            onClick={() => setRestoreTarget(shop)}
                            aria-label={`Restore ${shop.name}`}
                            className="inline-flex items-center py-2 text-green-700 hover:text-green-900 text-xs font-medium transition-colors"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollableTableCard>
          </div>

          <ul className="sm:hidden space-y-3" data-testid="shops-cards">
            {pageItems.map((shop) => {
              const status = getShopStatus(shop);
              return (
                <li
                  key={shop.id}
                  data-testid={`shop-card-${shop.id}`}
                  className={`glass-card divide-y divide-white/30 overflow-hidden ${shop.isDeleted ? 'opacity-60' : ''}`}
                >
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Store className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span className="font-medium text-indigo-900 break-words min-w-0">{shop.name}</span>
                      {shop.isDeleted && (
                        <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                          {shop.deletedAt ? `Deleted ${formatDate(shop.deletedAt)}` : 'Deleted'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_STYLE[status.kind]}`}>
                          {status.label}
                        </span>
                        {status.ordersPaused && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                            Orders paused
                          </span>
                        )}
                      </div>
                      {shop.offlineBySuperadmin && shop.offlineBySuperadminReason && (
                        <span className="text-xs text-gray-500 break-words">
                          Reason: {shop.offlineBySuperadminReason}
                        </span>
                      )}
                    </div>
                  </div>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 px-4 py-3 text-xs">
                    <dt className="text-gray-500">Slug</dt>
                    <dd className="text-gray-700 break-all">{shop.slug}</dd>
                    <dt className="text-gray-500">Currency</dt>
                    <dd className="text-gray-700">{shop.currency ?? '—'}</dd>
                    <dt className="text-gray-500">Created</dt>
                    <dd className="text-gray-700">{formatDate(shop.createdAt)}</dd>
                  </dl>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
                      <Link
                        to={`/shops/${shop.id}/subscription`}
                        aria-label={`Subscription for ${shop.name}`}
                        className="inline-flex items-center py-2 text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                      >
                        Subscription
                      </Link>
                      <Link
                        to={`/shops/${shop.id}/usage`}
                        aria-label={`Usage for ${shop.name}`}
                        className="inline-flex items-center py-2 text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                      >
                        Usage
                      </Link>
                      <Link
                        to={`/shops/${shop.id}/activity`}
                        state={{ shopName: shop.name }}
                        aria-label={`Activity for ${shop.name}`}
                        className="inline-flex items-center gap-1 py-2 text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                      >
                        Activity
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                      {!canWrite && !shop.isDeleted && (
                        <span
                          aria-label={`${missedOrdersLimitLabel(missedOrdersLimitOf(shop))} for ${shop.name}`}
                          className="text-gray-500 text-xs font-medium"
                        >
                          {missedOrdersLimitLabel(missedOrdersLimitOf(shop))}
                        </span>
                      )}
                      {canWrite && !shop.isDeleted && (
                        <button
                          onClick={() => openLimit(shop)}
                          aria-label={`${missedOrdersLimitLabel(missedOrdersLimitOf(shop))} for ${shop.name}`}
                          className="inline-flex items-center py-2 text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                        >
                          {missedOrdersLimitLabel(missedOrdersLimitOf(shop))}
                        </button>
                      )}
                      {canWrite && !shop.isDeleted && (
                        <button
                          onClick={() => setOfflineTarget(shop)}
                          aria-label={`${offlineActionLabel(shop, status)} for ${shop.name}`}
                          className={`inline-flex items-center py-2 ${shop.offlineBySuperadmin ? 'text-green-700 hover:text-green-900' : 'text-red-600 hover:text-red-800'} text-xs font-medium transition-colors`}
                        >
                          {offlineActionLabel(shop, status)}
                        </button>
                      )}
                      {canWrite && shop.isDeleted && (
                        <button
                          onClick={() => setRestoreTarget(shop)}
                          aria-label={`Restore ${shop.name}`}
                          className="inline-flex items-center py-2 text-green-700 hover:text-green-900 text-xs font-medium transition-colors"
                        >
                          Restore
                        </button>
                      )}
                  </div>
                </li>
              );
            })}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/40 bg-white/60 hover:bg-white/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/40 bg-white/60 hover:bg-white/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {restoreTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeRestore}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="restore-title"
            className="glass-card bg-white p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="restore-title" className="text-lg font-semibold text-indigo-900 mb-2">
              Restore {restoreTarget.name}?
            </h2>
            <p className="text-sm text-gray-600 mb-2">
              The shop becomes visible again to its owner and to diners.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Billing is not restarted. The owner must subscribe again.
            </p>
            {restoreError && <p className="text-sm text-red-500 mb-4">{restoreError}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={closeRestore}
                disabled={isRestoring}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmRestore}
                disabled={isRestoring}
                className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isRestoring ? 'Restoring...' : 'Restore shop'}
              </button>
            </div>
          </div>
        </div>
      )}
      {limitTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeLimit}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="limit-title"
            className="glass-card bg-white p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="limit-title" className="text-lg font-semibold text-indigo-900 mb-2">
              Auto-pause for {limitTarget.name}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Pause the shop automatically after this many orders in a row that nobody accepted in
              time. The pause stays until the restaurant switches ordering back on. The owner is
              emailed.
            </p>
            <select
              value={limitValue}
              onChange={(e) => setLimitValue(Number(e.target.value))}
              disabled={isSavingLimit}
              aria-label="Missed orders before auto-pause"
              className="mb-4 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {MISSED_ORDERS_LIMIT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? 'Off' : n}
                </option>
              ))}
            </select>
            {limitError && <p className="text-sm text-red-500 mb-4">{limitError}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={closeLimit}
                disabled={isSavingLimit}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmLimit}
                disabled={isSavingLimit}
                className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSavingLimit ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      {offlineTarget && (() => {
        const goOffline = !offlineTarget.offlineBySuperadmin;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={closeOffline}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="offline-title"
              className="glass-card bg-white p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="offline-title" className="text-lg font-semibold text-indigo-900 mb-2">
                {goOffline ? `Take ${offlineTarget.name} offline?` : `Bring ${offlineTarget.name} back online?`}
              </h2>
              {goOffline ? (
                <>
                  <p className="text-sm text-gray-600 mb-2">
                    The storefront shows no menu and diners see a popup saying the shop is offline.
                    The owner cannot bring it back online; only you can.
                    Orders still waiting for the restaurant&apos;s answer are declined and the diners&apos; card reservations released. Accepted orders are not touched.
                  </p>
                  <label className="block text-sm text-gray-600 mb-4">
                    Internal reason (optional)
                    <textarea
                      value={offlineReason}
                      onChange={(e) => setOfflineReason(e.target.value)}
                      maxLength={SUPERADMIN_REASON_MAX}
                      rows={3}
                      className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </label>
                </>
              ) : (
                <p className="text-sm text-gray-600 mb-4">
                  This removes the platform offline lock only. If the owner has also switched the
                  shop offline themselves, it stays offline until they switch it back on.
                </p>
              )}
              {offlineError && <p className="text-sm text-red-500 mb-4">{offlineError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  onClick={closeOffline}
                  disabled={isSettingOffline}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmOffline}
                  disabled={isSettingOffline}
                  className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSettingOffline
                    ? 'Saving...'
                    : goOffline
                      ? 'Take offline'
                      : 'Bring back online'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
