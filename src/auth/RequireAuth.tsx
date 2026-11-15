import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { Navigate } from 'react-router-dom';
import { useGetMeQuery } from '../services/api';
import { AccessDeniedPage } from '../pages/AccessDeniedPage';
import { ProfileLoadErrorPage } from '../pages/ProfileLoadErrorPage';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { canWrite, decideAccess } from './access';
import { CanWriteContext } from './platformAccess';

interface Props {
  children: React.ReactNode;
}

export function RequireAuth({ children }: Props) {
  const { accounts, inProgress } = useMsal();

  const isAuthenticated = accounts.length > 0;

  // Skip the /users/me call until MSAL is settled and the user is authenticated
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    refetch,
  } = useGetMeQuery(undefined, {
    skip: inProgress !== InteractionStatus.None || !isAuthenticated,
  });

  switch (
    decideAccess({
      msalSettled: inProgress === InteractionStatus.None,
      isAuthenticated,
      profileLoading,
      profileError,
      profile,
    })
  ) {
    // MSAL is still processing the redirect — don't make a routing decision yet
    case 'signing-in':
      return <LoadingScreen title="Signing you in" subtitle="Completing authentication." fullScreen />;
    case 'login':
      return <Navigate to="/login" replace />;
    case 'loading-profile':
      return <LoadingScreen title="Loading superadmin" subtitle="Checking your access and profile." fullScreen />;
    case 'profile-error':
      return <ProfileLoadErrorPage onRetry={() => refetch()} />;
    case 'denied':
      return <AccessDeniedPage />;
    case 'granted':
      return <CanWriteContext.Provider value={canWrite(profile)}>{children}</CanWriteContext.Provider>;
  }
}
