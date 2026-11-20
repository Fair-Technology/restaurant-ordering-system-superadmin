import { usePageTitle } from '../features/layout/usePageTitle';
import { Link } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useGetShopsQuery } from '../services/api';
import { Store, CreditCard, ArrowRight } from 'lucide-react';

export function DashboardPage() {
  usePageTitle('Dashboard');
  const { accounts } = useMsal();
  const account = accounts[0];
  const { data: shops, isLoading } = useGetShopsQuery();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-indigo-900 [overflow-wrap:anywhere]">
          Welcome back{account?.username ? `, ${account.username}` : ''}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Here's an overview of the platform.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Store className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-medium text-gray-500">Total Shops</span>
          </div>
          <p className="text-3xl font-semibold text-indigo-900">
            {isLoading ? '—' : (shops?.total ?? 0)}
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-medium text-gray-500">Plans</span>
          </div>
          <Link
            to="/plans"
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors mt-1"
          >
            Manage plans
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Link
          to="/shops"
          className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          View all shops
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/plans"
          className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Manage plans
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
