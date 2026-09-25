import { useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useGetAuditEntriesByShopQuery } from '../services/api';
import type { AuditEntry } from '../services/api';
import { ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react';
import { LoadingScreen } from '../components/ui/LoadingScreen';

const ENTITY_TYPE_LABELS: Record<string, string> = {
  product: 'Product',
  category: 'Category',
  shop: 'Shop',
  staff: 'Staff',
  subscription: 'Subscription',
};

const ENTITY_TYPE_COLORS: Record<string, string> = {
  product: 'bg-blue-100 text-blue-700',
  category: 'bg-green-100 text-green-700',
  shop: 'bg-purple-100 text-purple-700',
  staff: 'bg-orange-100 text-orange-700',
  subscription: 'bg-pink-100 text-pink-700',
};

const ACTION_LABELS: Record<string, string> = {
  'product.create': 'created product',
  'product.update': 'updated product',
  'product.delete': 'deleted product',
  'category.create': 'created category',
  'category.update': 'updated category',
  'category.delete': 'deleted category',
  'shop.update': 'updated shop',
  'shop.logo': 'updated shop logo',
  'member.add': 'added member',
  'member.remove': 'removed member',
  'role.create': 'created role',
  'role.update': 'updated role',
  'role.delete': 'deleted role',
};

const ENTITY_TYPES = ['all', 'product', 'category', 'shop', 'staff', 'subscription'] as const;

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (Array.isArray(v)) return v.join(', ') || '[]';
  return String(v);
}

function AuditEntryCard({ entry, actorLabel }: { entry: AuditEntry; actorLabel: string }) {
  const [expanded, setExpanded] = useState(false);
  const actionLabel = ACTION_LABELS[entry.action] ?? entry.action;
  const badgeClass = ENTITY_TYPE_COLORS[entry.entityType] ?? 'bg-gray-100 text-gray-700';
  const badgeLabel = ENTITY_TYPE_LABELS[entry.entityType] ?? entry.entityType;
  const hasDetails = entry.changes && entry.changes.length > 0;

  return (
    <div className="glass-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${badgeClass}`}>
            {badgeLabel}
          </span>
          <div className="min-w-0">
            <p className="text-sm text-gray-700">
              <span className="font-medium text-indigo-900">{actorLabel}</span>{' '}
              {actionLabel}{' '}
              <span className="font-semibold text-indigo-800">{entry.entityName}</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(entry.timestamp).toLocaleString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        {hasDetails && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex-shrink-0 text-gray-400 hover:text-indigo-600 transition-colors"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
      </div>

      {expanded && hasDetails && (
        <div className="mt-3 pt-3 border-t border-white/30 space-y-2">
          {entry.changes && entry.changes.length > 0 && (
            <div className="space-y-1">
              {entry.changes.map((c, i) => (
                <div key={i} className="text-xs text-gray-600 flex gap-1 flex-wrap">
                  <span className="font-mono font-medium text-gray-800">{c.field}:</span>
                  <span className="text-red-500 line-through">{formatValue(c.from)}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-green-600">{formatValue(c.to)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ShopActivityPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const location = useLocation();
  const shopName = (location.state as { shopName?: string })?.shopName ?? shopId;
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const pageSize = 20;

  const { data, isLoading, isError } = useGetAuditEntriesByShopQuery(
    { shopId: shopId!, page, pageSize },
    { skip: !shopId },
  );

  const filtered = entityFilter === 'all'
    ? (data?.entries ?? [])
    : (data?.entries ?? []).filter((e) => e.entityType === entityFilter);

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  if (isLoading) {
    return <LoadingScreen title="Loading activity" subtitle="Fetching the latest audit trail for this shop." />;
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-indigo-600 transition-colors">
          All Shops
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-indigo-900 font-medium">{shopName}</span>
        <ChevronRight className="w-4 h-4" />
        <span>Activity</span>
      </div>

      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold text-indigo-900">Activity Log</h1>

        {/* Entity type filter */}
        <select
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
          className="text-sm border border-white/40 rounded-lg bg-white/60 backdrop-blur px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === 'all' ? 'All types' : ENTITY_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {isError && (
        <div className="glass-card p-12 text-center text-sm text-red-500">
          Failed to load activity log.
        </div>
      )}

      {!isError && filtered.length === 0 && (
        <div className="glass-card p-12 text-center text-sm text-gray-500">
          No activity entries found.
        </div>
      )}

      {!isError && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <AuditEntryCard
              key={entry.id}
              entry={entry}
              actorLabel={data?.actorLabels[`${entry.actorType}:${entry.actorId}`] ?? entry.actorId}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.total > pageSize && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Page {page} of {totalPages} · {data.total} entries
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/40 bg-white/60 text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/80 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/40 bg-white/60 text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/80 transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
