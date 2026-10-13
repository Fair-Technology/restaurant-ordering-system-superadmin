import { useState } from 'react';
import {
  useGetShopsQuery,
  useApproveShopNameChangeMutation,
  useRejectShopNameChangeMutation,
} from '../services/api';
import { apiErrorMessage } from '../utils/apiError';
import { FileEdit } from 'lucide-react';
import { LoadingScreen } from '../components/ui/LoadingScreen';

export function NameChangeRequestsPage() {
  const { data: shopsData, isLoading, isError } = useGetShopsQuery();
  const [approveShopNameChange] = useApproveShopNameChangeMutation();
  const [rejectShopNameChange] = useRejectShopNameChangeMutation();
  const [actionError, setActionError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pending = (shopsData?.shops ?? []).filter((s) => s.pendingNameChange != null);

  const handleApprove = async (shopId: string) => {
    setProcessingId(shopId);
    setActionError(null);
    try {
      await approveShopNameChange({ shopId }).unwrap();
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Failed to approve name change'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (shopId: string) => {
    setProcessingId(shopId);
    setActionError(null);
    try {
      await rejectShopNameChange({ shopId }).unwrap();
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Failed to reject name change'));
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return <LoadingScreen title="Loading requests" subtitle="Fetching pending shop name changes." />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-indigo-900">Name Change Requests</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {`${pending.length} pending request${pending.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {isError && (
        <div className="glass-card p-12 text-center text-sm text-red-500">
          Failed to load shops. Please try again.
        </div>
      )}

      {!isError && pending.length === 0 && (
        <div className="glass-card p-12 text-center">
          <FileEdit className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No pending name change requests.</p>
        </div>
      )}

      {!isError && pending.length > 0 && (
        <div className="glass-card overflow-hidden">
          {actionError && (
            <div className="px-6 py-3 bg-red-50 border-b border-red-100 text-sm text-red-600">
              {actionError}
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/30">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Requested By
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Requested At
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {pending.map((shop) => {
                const req = shop.pendingNameChange!;
                const isProcessing = processingId === shop.id;
                return (
                  <tr key={shop.id} className="hover:bg-white/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{shop.name}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-indigo-700">{req.requestedName}</span>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{req.requestedSlug}</p>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-xs text-gray-500 font-mono" title={req.requestedBy}>
                        {req.requestedBy.slice(0, 8)}…
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 hidden lg:table-cell">
                      {new Date(req.requestedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleApprove(shop.id)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(shop.id)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
