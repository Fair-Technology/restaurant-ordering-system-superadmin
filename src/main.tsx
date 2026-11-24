import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { msalInstance } from './auth/msalConfig.ts';

// MSAL silently renews tokens by loading a redirect URI into a hidden iframe. If this app's
// bootstrap runs inside that iframe, MSAL's own initialize()/handleRedirectPromise() detects
// it and throws BrowserAuthError "block_iframe_reload". Never initialize MSAL or render the
// app in that hidden-iframe context; let MSAL's own iframe handling finish and postMessage
// the result back to the parent window.
const isHiddenIframe = window !== window.parent && !window.opener;

if (!isHiddenIframe) {
  msalInstance.initialize().then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
}
