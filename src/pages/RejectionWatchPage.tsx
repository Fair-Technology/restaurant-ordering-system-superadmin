import { Link } from 'react-router-dom';
import { useGetRejectionWatchQuery } from '../services/api';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { RejectionFlagBadges } from '../components/RejectionFlagBadges';

export function RejectionWatchPage() {
  const { data, isLoading, isError } = useGetRejectionWatchQuery();

  if (isLoading) return <LoadingScreen title="Loading decline watch" subtitle="Counting declined orders for every restaurant." />;
  if (isError || !data) return (
    <div className="glass-card p-12 text-center text-sm text-red-500">Failed to load the decline watch.</div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-indigo-900">Decline watch</h1>
        <p className="text-sm text-gray-500 mt-1">
          Restaurants that decline many orders, or decline several while close to their monthly limit. Flagged first.
        </p>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3">Restaurant</th>
              <th className="px-4 py-3">Orders this month</th>
              <th className="px-4 py-3">Warning</th>
              <th className="px-4 py-3">Decline rate</th>
              <th className="px-4 py-3">Flags</th>
            </tr>
          </thead>
          <tbody>
            {data.shops.map((row) => (
              <tr key={row.shopId} className="border-t border-white/30">
                <td className="px-4 py-3">
                  <Link to={`/shops/${row.shopId}/usage`} className="text-indigo-700 hover:underline">
                    {row.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {row.orderLimit.acceptedOrderCount} / {row.orderLimit.limit ?? 'unlimited'}
                </td>
                <td className="px-4 py-3 text-gray-700">{row.orderLimit.warningLevel}%</td>
                <td className="px-4 py-3 text-gray-700">
                  {row.rejections.rate === null ? '—' : `${Math.round(row.rejections.rate * 100)}%`}
                  <span className="text-gray-400"> ({row.rejections.rejectedByRestaurant} declined)</span>
                </td>
                <td className="px-4 py-3"><RejectionFlagBadges flags={row.rejections.flags} /></td>
              </tr>
            ))}
            {data.shops.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No restaurants yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
