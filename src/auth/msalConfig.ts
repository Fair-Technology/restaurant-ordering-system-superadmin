import { PublicClientApplication } from '@azure/msal-browser';
import type { Configuration, RedirectRequest } from '@azure/msal-browser';

/**
 * Platform operators sign in through our workforce tenant, which lives on
 * login.microsoftonline.com. Set VITE_MSAL_AUTHORITY to that authority, e.g.
 * https://login.microsoftonline.com/<workforce-tenant-id>.
 *
 * When it is not set we fall back to the CIAM (customer) tenant form the
 * customer-facing apps use, so a deployment that has not been switched over yet
 * keeps working exactly as before.
 */
const authority = import.meta.env.VITE_MSAL_AUTHORITY
  ? (import.meta.env.VITE_MSAL_AUTHORITY as string)
  : `https://${import.meta.env.VITE_MSAL_TENANT_NAME}.ciamlogin.com/${import.meta.env.VITE_MSAL_TENANT_ID}`;

const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID,
    authority,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  // localStorage: a sign-in carries over to new tabs and browser restarts; signing out clears it.
  cache: { cacheLocation: 'localStorage' },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest: RedirectRequest = {
  scopes: ['openid', 'profile', 'offline_access'],
};

export const apiRequest = {
  scopes: [import.meta.env.VITE_MSAL_API_SCOPE as string],
};
