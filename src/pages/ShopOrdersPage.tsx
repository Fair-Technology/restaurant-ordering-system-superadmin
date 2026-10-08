import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetOrdersByShopQuery } from '../services/api';
import { ChevronLeft, ChevronLeft as Prev, ChevronRight as Next } from 'lucide-react';
import { LoadingScreen } from '../components/ui/LoadingScreen';

const STATUS_LABELS: Record<string, string> = {
  PLACED: 'Placed',
  ACCEPTED: 'Accepted',
  IN_PREPARATION: 'In preparation',
  READY: 'Ready',
  OUT_FOR_DELIVERY: 'Out for delivery',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

function statusBadgeClass(displayState: string) {
  switch (displayState) {
    case 'PLACED':
    case 'ACCEPTED':
      return 'bg-blue-100 text-blue-700';
    case 'IN_PREPARATION':
      return 'bg-yellow-100 text-yellow-700';
    case 'READY':
    case 'OUT_FOR_DELIVERY':
    case 'COMPLETED':
      return 'bg-green-100 text-green-700';
    case 'REJECTED':
    case 'CANCELLED':
      return 'bg-red-100 text-red-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

const PAGE_SIZE = 20;

export function ShopOrdersPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useGetOrdersByShopQuery(
    { shopId: shopId ?? '', page, pageSize: PAGE_SIZE },
    { skip: !shopId },
  );

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  if (isLoading) {
    return <LoadingScreen title="Loading orders" subtitle="Fetching recent orders for this shop." />;
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/shops"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-700 transition-colors mb-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Shops
        </Link>
        <h1 className="text-2xl font-semibold text-indigo-900">Orders</h1>
        {data && (
          <p className="text-sm text-gray-500 mt-0.5">{data.total} orders total</p>
        )}
      </div>

      {isError && (
        <div className="glass-card p-12 text-center text-sm text-red-500">
          Failed to load orders. Please try again.
        </div>
      )}

      {!isError && data?.orders.length === 0 && (
        <div className="glass-card p-12 text-center text-sm text-gray-500">
          No orders found for this shop.
        </div>
      )}

      {!isError && data && data.orders.length > 0 && (
        <>
          <div className="glass-card overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/30">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Ref
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Customer
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Total
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {data.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-indigo-900">{order.orderRef}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block text-xs px-2 py-0.5 rounded font-medium ${statusBadgeClass(order.displayState)}`}
                      >
                        {STATUS_LABELS[order.displayState] ?? order.displayState}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 hidden md:table-cell">
                      {order.customerName ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 hidden sm:table-cell">
                      {((order.totalCents ?? order.subtotalCents) / 100).toFixed(2)} {order.currency.toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-gray-500 hidden lg:table-cell">
                      {new Date(order.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
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
                <Prev className="w-4 h-4" />
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
                <Next className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
