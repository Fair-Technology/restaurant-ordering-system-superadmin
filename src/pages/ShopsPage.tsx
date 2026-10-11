import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetShopsQuery, useRestoreShopMutation, useSetShopSuperadminOfflineMutation, type ShopResponse } from '../services/api';
import { Store, ArrowRight, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getShopStatus, SUPERADMIN_REASON_MAX, type ShopStatusKind } from './shop-status';
import { LoadingScreen } from '../components/ui/LoadingScreen';

const PAGE_SIZE = 20;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_STYLE: Record<ShopStatusKind, string> = {
  online: 'bg-green-100 text-green-700',
  'offline-owner': 'bg-amber-100 text-amber-700',
  'offline-platform': 'bg-red-100 text-red-600',
};

export function ShopsPage() {
  const { data: shops, isLoading, isError } = useGetShopsQuery();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showDeleted, setShowDeleted] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<ShopResponse | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreShop, { isLoading: isRestoring }] = useRestoreShopMutation();

  const [offlineTarget, setOfflineTarget] = useState<ShopResponse | null>(null);
  const [offlineReason, setOfflineReason] = useState('');
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const [setSuperadminOffline, { isLoading: isSettingOffline }] =
    useSetShopSuperadminOfflineMutation();

  const filtered = (shops?.shops ?? []).filter(
    (s) => (showDeleted || !s.isDeleted) && s.name.toLowerCase().includes(search.toLowerCase()),
  );

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
    const goOffline = !offlineTarget.offlineBySuperadmin;
    try {
      await setSuperadminOffline({
        shopId: offlineTarget.id,
        offline: goOffline,
        reason: goOffline ? offlineReason.trim() : undefined,
      }).unwrap();
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

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
            {shops ? `${shops.total} shops total` : ''}
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-white/40 rounded-lg bg-white/60 backdrop-blur focus:outline-none focus:ring-2 focus:ring-indigo-300 w-56"
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
          <div className="glass-card overflow-hidden mb-4">
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
                {pageItems.map((shop) => (
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
                        const status = getShopStatus(shop);
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
                      <div className="inline-flex items-center gap-3">
                        <Link
                          to={`/shops/${shop.id}/subscription`}
                          className="text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                        >
                          Subscription
                        </Link>
                        <Link
                          to={`/shops/${shop.id}/usage`}
                          className="text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                        >
                          Usage
                        </Link>
                        <Link
                          to={`/shops/${shop.id}/activity`}
                          state={{ shopName: shop.name }}
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                        >
                          Activity
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                        {!shop.isDeleted && (
                          <button
                            onClick={() => setOfflineTarget(shop)}
                            className={`${shop.offlineBySuperadmin ? 'text-green-700 hover:text-green-900' : 'text-red-600 hover:text-red-800'} text-xs font-medium transition-colors`}
                          >
                            {shop.offlineBySuperadmin ? 'Bring back online' : 'Take offline'}
                          </button>
                        )}
                        {shop.isDeleted && (
                          <button
                            onClick={() => setRestoreTarget(shop)}
                            className="text-green-700 hover:text-green-900 text-xs font-medium transition-colors"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
