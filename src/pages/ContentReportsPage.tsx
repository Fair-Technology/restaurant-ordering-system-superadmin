import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useDecideContentReportMutation,
  useGetShopsQuery,
  useListContentReportsQuery,
  useSetShopOfflineBySuperadminMutation,
  type ContentReport,
} from '../services/api';
import { apiErrorMessage } from '../utils/apiError';
import { ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { WriteFieldset, WriteOnly } from '../auth/WriteOnly';
import { getShopStatus, SUPERADMIN_REASON_MAX, type ShopStatusKind } from './shop-status';
import { buildSuperadminOfflineRequest } from './shops-list';
import {
  CONTENT_REPORT_PAGE_SIZE,
  DECISION_REASON_MAX,
  STATUS_FILTERS,
  categoryLabel,
  decisionErrorMessage,
  formatReceivedAt,
  hasMorePages,
  isAlreadyDecidedError,
  isDecided,
  statusBadgeClass,
  statusLabel,
  validateDecisionReason,
  type StatusFilter,
} from './content-reports';

type Decision = 'actioned' | 'dismissed';

const STATUS_STYLE: Record<ShopStatusKind, string> = {
  online: 'bg-green-100 text-green-700',
  'offline-owner': 'bg-amber-100 text-amber-700',
  'offline-platform': 'bg-red-100 text-red-600',
};

export function ContentReportsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // The dialog is a real modal: it takes focus on open, traps Tab, closes on Escape and returns
  // focus to the row that opened it. Kept as refs because none of this belongs in render state.
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const { data, isLoading, isError, refetch } = useListContentReportsQuery({
    status: statusFilter,
    page,
    pageSize: CONTENT_REPORT_PAGE_SIZE,
  });

  const [decideContentReport, { isLoading: isDeciding }] = useDecideContentReportMutation();
  const [decision, setDecision] = useState<Decision>('actioned');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { data: shopsData, isLoading: shopsLoading, isError: shopsError } = useGetShopsQuery();
  const [setSuperadminOffline, { isLoading: isSettingOffline }] =
    useSetShopOfflineBySuperadminMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [offlineReason, setOfflineReason] = useState('');
  const [offlineError, setOfflineError] = useState<string | null>(null);

  const reports = data ?? [];
  // Derived from the current query data, so a refetch (tag invalidation or the 409 guard) re-renders
  // with the server's own row rather than a locally patched copy.
  const selected: ContentReport | undefined = reports.find((r) => r.id === selectedId);
  const shop = selected ? shopsData?.shops.find((s) => s.id === selected.shopId) : undefined;

  const resetDetail = () => {
    setDecision('actioned');
    setReason('');
    setFormError(null);
    setNotice(null);
    setConfirmOpen(false);
    setOfflineReason('');
    setOfflineError(null);
  };

  const selectReport = (id: string, trigger?: HTMLElement | null) => {
    triggerRef.current = trigger ?? (document.activeElement as HTMLElement | null);
    setSelectedId(id);
    resetDetail();
  };

  const closeDetail = () => {
    setSelectedId(null);
    resetDetail();
    triggerRef.current?.focus();
    triggerRef.current = null;
  };

  useEffect(() => {
    if (selectedId) dialogRef.current?.focus();
  }, [selectedId]);

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      closeDetail();
      return;
    }
    if (event.key !== 'Tab') return;
    const root = dialogRef.current;
    if (!root) return;
    const focusable = Array.from(
      root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (!active || !root.contains(active)) {
      event.preventDefault();
      first.focus();
      return;
    }
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const changeFilter = (value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleSubmit = async (report: ContentReport) => {
    setNotice(null);
    const validation = validateDecisionReason(reason);
    if (validation) {
      setFormError(validation);
      return;
    }
    setFormError(null);
    try {
      await decideContentReport({
        reportId: report.id,
        decideContentReportBody: { decision, reason: reason.trim() },
      }).unwrap();
      setNotice('Decision recorded.');
      setReason('');
      setDecision('actioned');
    } catch (err) {
      setFormError(decisionErrorMessage(err, 'Failed to record the decision'));
      if (isAlreadyDecidedError(err)) {
        // Someone else decided first: do not retry the POST, just read the true state back.
        void refetch();
      }
    }
  };

  const openOfflineConfirm = () => {
    setOfflineError(null);
    setConfirmOpen(true);
  };

  const closeOfflineConfirm = () => {
    if (isSettingOffline) return;
    setConfirmOpen(false);
    setOfflineReason('');
    setOfflineError(null);
  };

  const confirmOffline = async () => {
    if (!shop) return;
    const request = buildSuperadminOfflineRequest(shop, offlineReason);
    try {
      await setSuperadminOffline({
        shopId: request.shopId,
        body: { offline: request.offline, reason: request.reason },
      }).unwrap();
      setConfirmOpen(false);
      setOfflineReason('');
      setOfflineError(null);
    } catch (err) {
      setOfflineError(apiErrorMessage(err, 'Could not update the storefront. Please try again.'));
    }
  };

  if (isLoading) {
    return <LoadingScreen title="Loading content reports" subtitle="Fetching the report queue." />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-indigo-900">Content reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Illegal-content reports raised by visitors and shop owners, newest first.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value || 'all'}
              type="button"
              aria-pressed={statusFilter === filter.value}
              onClick={() => changeFilter(filter.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                statusFilter === filter.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white/60 border-white/40 text-gray-600 hover:bg-white/80'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {isError && (
        <div className="glass-card p-12 text-center text-sm text-red-500">
          Failed to load content reports. Please try again.
        </div>
      )}

      {!isError && reports.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Flag className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No content reports for this filter.</p>
        </div>
      )}

      {!isError && reports.length > 0 && (
        <div className="glass-card overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/30">
                <th scope="col" className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shop
                </th>
                <th scope="col" className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Received
                </th>
                <th scope="col" className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Decision
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {reports.map((report) => (
                <tr
                  key={report.id}
                  tabIndex={0}
                  aria-label={`Open report from ${report.shopName}`}
                  onClick={(event) => selectReport(report.id, event.currentTarget)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      selectReport(report.id, event.currentTarget);
                    }
                  }}
                  className={`cursor-pointer hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                    report.id === selectedId ? 'bg-white/30' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <span className="font-medium text-indigo-900">{report.shopName}</span>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{report.shopSlug}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{categoryLabel(report.category)}</td>
                  <td className="px-6 py-4 text-gray-500 hidden md:table-cell">
                    {formatReceivedAt(report.receivedAt)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${statusBadgeClass(report.status)}`}
                    >
                      {statusLabel(report.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 hidden lg:table-cell">
                    {report.decision ? (
                      <span>
                        {statusLabel(report.decision.decision)}
                        <span className="text-xs text-gray-400 block">
                          {report.decision.decidedBy} · {formatReceivedAt(report.decision.decidedAt)}
                        </span>
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isError && (reports.length > 0 || page > 1) && (
        <div className="flex items-center justify-end gap-3 text-sm text-gray-500">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/40 bg-white/60 hover:bg-white/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          <span>Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMorePages(reports)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/40 bg-white/60 hover:bg-white/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto"
          onClick={closeDetail}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
            tabIndex={-1}
            onKeyDown={handleDialogKeyDown}
            className="glass-card bg-white p-6 w-full max-w-2xl my-8 focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 id="report-title" className="text-lg font-semibold text-indigo-900">
                  {selected.shopName}
                </h2>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{selected.shopSlug}</p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded ${statusBadgeClass(selected.status)}`}
              >
                {statusLabel(selected.status)}
              </span>
            </div>

            <dl className="text-sm text-gray-600 mb-4 space-y-2">
              <div className="flex gap-2">
                <dt className="w-28 flex-shrink-0 text-gray-500">Category</dt>
                <dd>{categoryLabel(selected.category)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 flex-shrink-0 text-gray-500">Received</dt>
                <dd>{formatReceivedAt(selected.receivedAt)}</dd>
              </div>
              {selected.reporterName && (
                <div className="flex gap-2">
                  <dt className="w-28 flex-shrink-0 text-gray-500">Reporter</dt>
                  <dd>{selected.reporterName}</dd>
                </div>
              )}
              {selected.reporterEmail && (
                <div className="flex gap-2">
                  <dt className="w-28 flex-shrink-0 text-gray-500">Email</dt>
                  <dd>{selected.reporterEmail}</dd>
                </div>
              )}
              {selected.contentUrl && (
                <div className="flex gap-2">
                  <dt className="w-28 flex-shrink-0 text-gray-500">Content</dt>
                  <dd className="break-all">
                    <a
                      href={selected.contentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 underline"
                    >
                      {selected.contentUrl}
                    </a>
                  </dd>
                </div>
              )}
            </dl>

            <div className="mb-6">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Reporter&apos;s report
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.reason}</p>
            </div>

            {/* Outside the isDecided ternary: the follow-up refetch that follows a 409 unmounts the
                decision form, so feedback rendered inside it would flash and vanish. */}
            {formError && (
              <p role="alert" className="text-sm text-red-500 mb-4">
                {formError}
              </p>
            )}
            <p role="status" aria-live="polite" className="text-sm text-green-600 mb-4">
              {notice ?? ''}
            </p>

            {isDecided(selected) ? (
              <div className="mb-6 rounded-lg border border-white/40 bg-white/50 p-4">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Recorded decision
                </h3>
                {selected.decision ? (
                  <dl className="text-sm text-gray-600 space-y-1">
                    <div className="flex gap-2">
                      <dt className="w-28 flex-shrink-0 text-gray-500">Decision</dt>
                      <dd className="font-medium text-gray-900">
                        {statusLabel(selected.decision.decision)}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-28 flex-shrink-0 text-gray-500">Reason</dt>
                      <dd className="whitespace-pre-wrap">{selected.decision.reason}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-28 flex-shrink-0 text-gray-500">Decided by</dt>
                      <dd>{selected.decision.decidedBy}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-28 flex-shrink-0 text-gray-500">Decided at</dt>
                      <dd>{formatReceivedAt(selected.decision.decidedAt)}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm text-gray-500">No decision details were returned.</p>
                )}
              </div>
            ) : (
              <WriteFieldset className="mb-6 rounded-lg border border-white/40 bg-white/50 p-4">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Record the platform&apos;s decision
                </h3>
                <div className="flex items-center gap-4 mb-3">
                  {(['actioned', 'dismissed'] as const).map((value) => (
                    <label key={value} className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="radio"
                        name="decision"
                        value={value}
                        checked={decision === value}
                        onChange={() => setDecision(value)}
                        disabled={isDeciding}
                      />
                      {statusLabel(value)}
                    </label>
                  ))}
                </div>
                <label className="block text-sm text-gray-600 mb-3">
                  Reason (required)
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={DECISION_REASON_MAX}
                    rows={3}
                    disabled={isDeciding}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </label>
                <WriteOnly>
                  <button
                    onClick={() => handleSubmit(selected)}
                    disabled={isDeciding}
                    className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {isDeciding ? 'Saving...' : 'Record decision'}
                  </button>
                </WriteOnly>
              </WriteFieldset>
            )}

            <div className="rounded-lg border border-white/40 bg-white/50 p-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Storefront
              </h3>
              {shop ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${STATUS_STYLE[getShopStatus(shop).kind]}`}
                    >
                      {getShopStatus(shop).label}
                    </span>
                    <Link
                      to="/shops"
                      className="text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                    >
                      Open in Shops
                    </Link>
                  </div>
                  {!confirmOpen ? (
                    <WriteOnly>
                      <button
                        onClick={openOfflineConfirm}
                        className={`${
                          shop.offlineBySuperadmin
                            ? 'text-green-700 hover:text-green-900'
                            : 'text-red-600 hover:text-red-800'
                        } text-xs font-medium transition-colors`}
                      >
                        {shop.offlineBySuperadmin ? 'Bring back online' : 'Take storefront offline'}
                      </button>
                    </WriteOnly>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        {shop.offlineBySuperadmin
                          ? 'This removes the platform offline lock only.'
                          : 'The storefront shows no menu and diners see an offline notice. Only a platform operator can undo this.'}
                      </p>
                      {!shop.offlineBySuperadmin && (
                        <label className="block text-sm text-gray-600 mb-3">
                          Internal reason (optional)
                          <textarea
                            value={offlineReason}
                            onChange={(e) => setOfflineReason(e.target.value)}
                            maxLength={SUPERADMIN_REASON_MAX}
                            rows={3}
                            className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          />
                        </label>
                      )}
                      {offlineError && (
                        <p role="alert" className="text-sm text-red-500 mb-3">
                          {offlineError}
                        </p>
                      )}
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={closeOfflineConfirm}
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
                          {isSettingOffline ? 'Saving...' : 'Confirm'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : shopsLoading || shopsError ? (
                <>
                  <p className="text-sm text-gray-500 mb-2">Checking the storefront…</p>
                  <Link
                    to="/shops"
                    className="text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                  >
                    Open in Shops
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-2">
                    This shop is not in the loaded shop list, so its storefront state is unknown.
                  </p>
                  <WriteOnly>
                    <button
                      disabled
                      className="text-xs font-medium text-gray-400 cursor-not-allowed"
                    >
                      Storefront switch unavailable
                    </button>
                  </WriteOnly>
                  <Link
                    to="/shops"
                    className="ml-4 text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                  >
                    Open in Shops
                  </Link>
                </>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={closeDetail}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
