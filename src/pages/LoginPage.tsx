import { usePageTitle } from '../features/layout/usePageTitle';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { Navigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { msalInstance, loginRequest } from '../auth/msalConfig';

export function LoginPage() {
  usePageTitle('Login');
  const { accounts, inProgress } = useMsal();

  if (inProgress === InteractionStatus.None && accounts.length > 0) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = () => {
    msalInstance.loginRedirect(loginRequest);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-10 w-full max-w-sm text-center">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-indigo-900 mb-2">Superadmin Portal</h1>
        <p className="text-sm text-gray-500 mb-8">Internal company access only</p>
        <button
          onClick={handleSignIn}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          Sign in as Superadmin
        </button>
      </div>
    </div>
  );
}
