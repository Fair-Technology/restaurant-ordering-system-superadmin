import { useParams, useNavigate } from 'react-router-dom';
import { useGetShopUsageQuery, useReconcileShopUsageMutation } from '../services/api';
import { LoadingScreen } from '../components/ui/LoadingScreen';

export function ShopUsagePage() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetShopUsageQuery({ shopId: shopId! });
  const [reconcile, { isLoading: isReconciling, data: reconcileData }] = useReconcileShopUsageMutation();

  if (isLoading) return <LoadingScreen title="Loading usage" subtitle="Fetching usage counters and reconciliation status." />;
  if (isError || !data) return (
    <div className="glass-card p-12 text-center text-sm text-red-500">Failed to load usage.</div>
  );

  const usage = reconcileData?.usage ?? data.usage;
  const ordersPerMonthLimit = data.ordersPerMonthLimit;
  const limitLabel =
    ordersPerMonthLimit === null ? null : ordersPerMonthLimit === -1 ? '/ unlimited' : `/ ${ordersPerMonthLimit}`;

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-500 hover:text-indigo-600 mb-2 inline-block transition-colors"
        >
          ← All Shops
        </button>
        <h1 className="text-2xl font-semibold text-indigo-900">Usage — Shop {shopId}</h1>
      </div>

      <div className="glass-card p-6 space-y-5">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Counters</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Accepted orders — {usage.periodKey}</p>
            <p className="text-4xl font-semibold text-indigo-900">
              {usage.acceptedOrderCount}
              {limitLabel && <span className="text-lg font-normal text-gray-500"> {limitLabel}</span>}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Last Reconciled</p>
            <p className="text-sm text-gray-700">
              {usage.lastReconciled ? new Date(usage.lastReconciled).toLocaleString() : 'Never'}
            </p>
          </div>
        </div>

        {reconcileData && (
          <p className="text-green-600 text-sm">
            Reconciled: counted {reconcileData.reconciledCount} accepted orders this month.
          </p>
        )}

        <button
          onClick={() => reconcile({ shopId: shopId! })}
          disabled={isReconciling}
          className="border border-indigo-300 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 disabled:opacity-50 transition-colors"
        >
          {isReconciling ? 'Reconciling…' : 'Reconcile Now'}
        </button>
      </div>
    </div>
  );
}
