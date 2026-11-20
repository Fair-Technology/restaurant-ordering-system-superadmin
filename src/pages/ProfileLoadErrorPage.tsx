import { usePageTitle } from '../features/layout/usePageTitle';
import { useMsal } from '@azure/msal-react';
import { AlertTriangle } from 'lucide-react';
import { msalInstance } from '../auth/msalConfig';

interface Props {
  onRetry: () => void;
}

export function ProfileLoadErrorPage({ onRetry }: Props) {
  usePageTitle('Profile Error');
  const { accounts } = useMsal();
  const email = accounts[0]?.username ?? accounts[0]?.name;

  const handleSignOut = () => {
    msalInstance.logoutRedirect();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div role="alert" className="glass-card p-10 w-full max-w-sm text-center">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Couldn't load your profile</h1>
        <p className="text-sm text-gray-500 mb-1">
          The superadmin access check failed. Your sign-in session may have expired. Try again, or sign out and sign
          back in.
        </p>
        {email && <p className="text-xs text-gray-400 mb-8 break-all">Signed in as: {email}</p>}
        {!email && <div className="mb-8" />}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
