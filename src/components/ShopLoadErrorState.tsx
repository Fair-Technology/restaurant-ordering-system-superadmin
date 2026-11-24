import { useNavigate } from 'react-router-dom';

export function ShopLoadErrorState({ status, resource }: { status?: number; resource: string }) {
  const navigate = useNavigate();
  const isNotFound = status === 404;
  const isForbidden = status === 403;
  const title = isNotFound ? 'Shop not found' : isForbidden ? 'Not allowed' : `Failed to load ${resource}`;
  const description = isNotFound
    ? "This shop doesn't exist or you no longer have access to it."
    : isForbidden
      ? "You don't have permission to view this shop."
      : `Something went wrong while loading the ${resource}. Please try again.`;
  return (
    <div className="glass-card p-12 flex flex-col items-center gap-3 text-center">
      <h2 className="text-lg font-semibold text-indigo-900">{title}</h2>
      <p className="max-w-sm text-sm text-gray-500">{description}</p>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="mt-2 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
      >
        ← All Shops
      </button>
    </div>
  );
}
