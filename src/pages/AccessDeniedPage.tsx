import { usePageTitle } from '../features/layout/usePageTitle';
import { useMsal } from '@azure/msal-react';
import { ShieldOff } from 'lucide-react';
import { msalInstance } from '../auth/msalConfig';

export function AccessDeniedPage() {
  usePageTitle('Access Denied');
  const { accounts } = useMsal();
  const email = accounts[0]?.username ?? accounts[0]?.name ?? 'Unknown';

  const handleSignOut = () => {
    msalInstance.logoutRedirect();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-10 w-full max-w-sm text-center">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
            <ShieldOff className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-sm text-gray-500 mb-1">You do not have superadmin access.</p>
        <p className="text-xs text-gray-400 mb-8 break-all">Signed in as: {email}</p>
        <button
          onClick={handleSignOut}
          className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
