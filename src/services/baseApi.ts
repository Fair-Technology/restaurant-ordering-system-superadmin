import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { msalInstance, apiRequest } from '../auth/msalConfig';

// Set once a sign-in redirect has been started, so a burst of concurrent queries
// whose silent token acquisition fails triggers exactly one redirect.
let redirectingToLogin = false;

function redirectToLoginOnce() {
  if (redirectingToLogin) return;
  redirectingToLogin = true;
  void msalInstance.loginRedirect(apiRequest);
}

class TokenUnavailableError extends Error {}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  prepareHeaders: async (headers) => {
    const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];
    if (account) {
      try {
        const result = await msalInstance.acquireTokenSilent({ ...apiRequest, account });
        headers.set('Authorization', `Bearer ${result.accessToken}`);
      } catch {
        redirectToLoginOnce();
        // Throw rather than return headers: fetchBaseQuery awaits prepareHeaders before it
        // builds the Request, so throwing aborts the call before any network request is made.
        // Returning would send the request unauthenticated (the API answers 403).
        throw new TokenUnavailableError();
      }
    }
    return headers;
  },
});

// Converts the abort above into a normal RTK Query error result instead of a rejection.
const baseQueryWithAuthGuard: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  try {
    return await rawBaseQuery(args, api, extraOptions);
  } catch (e) {
    if (e instanceof TokenUnavailableError) {
      const error: FetchBaseQueryError = { status: 'CUSTOM_ERROR', error: 'Authentication required' };
      return { error };
    }
    throw e;
  }
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuthGuard,
  tagTypes: [
    'Shops',
    'AuditEntries',
    'UserProfile',
    'Plans',
    'Subscriptions',
    'Usage',
    'Orders',
    'RolePermissions',
    'ReferenceLists',
    'PlatformLegal',
  ],
  endpoints: () => ({}),
});
