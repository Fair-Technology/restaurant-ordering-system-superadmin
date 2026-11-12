# rs-superadmin

The platform-staff console of the restaurant ordering system (React + TypeScript + Vite).

## Running locally

### 1. Start the backend first

The console only renders data it gets from the API, so start `rs-backend` before the app:

```bash
cd ../rs-backend
npm start                 # = npm run build && func start → http://localhost:7071/api
```

- Needs Azure Functions Core Tools v4 (`func`) and the backend's own `local.settings.json`. That file holds live dev credentials and isn't committed; ask for it.
- The local backend talks to the **shared dev** Cosmos DB and storage (no Azurite). Its three timers are switched off locally (`AzureWebJobs.<timer>.Disabled = true`); the deployed dev app runs them.
- Its CORS allow-list is exactly `http://localhost:5173`–`http://localhost:5176`. An app served from any other origin (including `127.0.0.1`) will have its API calls blocked.

Quick check: `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:7071/api/shops/public` → `200`.

### 2. Configure `.env.local`

Create `.env.local` in this folder (it's git-ignored). The app reads:

| Variable | Required | Value |
|---|---|---|
| `VITE_API_BASE_URL` | yes | `http://localhost:7071/api`. **Must end in `/api`**: `src/services/baseApi.ts` uses it as-is (unlike the storefront, nothing appends `/api`) |
| `VITE_MSAL_CLIENT_ID` | yes | client id of the **`restaurant-ordering-superadmin-workforce`** app registration |
| `VITE_MSAL_AUTHORITY` | yes, for the workforce tenant | `https://login.microsoftonline.com/<workforce-tenant-id>` |
| `VITE_MSAL_API_SCOPE` | yes | the backend API scope the console requests tokens for |
| `VITE_MSAL_TENANT_NAME`, `VITE_MSAL_TENANT_ID` | only if `VITE_MSAL_AUTHORITY` is unset | fallback CIAM authority `https://<name>.ciamlogin.com/<id>` (`src/auth/msalConfig.ts`) |

Platform operators sign in through the workforce tenant, so in practice set `VITE_MSAL_AUTHORITY` and leave the two `TENANT_*` values out.

### 3. Run on port 5174

```bash
npm install
npm run dev -- --port 5174 --strictPort
```

Open **http://localhost:5174**. Use `localhost`, not `127.0.0.1`: Vite binds IPv6 (`::1`) only, so `http://127.0.0.1:5174` doesn't answer even while the app is running.

The port matters:
- `vite.config.ts` doesn't pin one, so a bare `npm run dev` takes 5173 or whatever is free.
- `--strictPort` makes Vite fail loudly instead of drifting to another port.
- MSAL redirects back to `window.location.origin`, and the app registration's SPA redirect URIs include `http://localhost:5174` (also 5173 and 5175), so sign-in only works from those origins.

The other apps use their own fixed ports:

| App | Port |
|---|---|
| rs-backend (Functions host) | 7071 |
| rs-superadmin (this repo) | 5174 |
| rs-admin | 5175 |
| rs-storefront | 5176 |

### 4. Checks

```bash
npm run typecheck     # tsc -b
npm test              # vitest run
npm run build         # tsc -b && vite build
```

### API client

`src/services/api.ts` and `src/services/baseApi.ts` hold the RTK Query client. There is no codegen script in this repo yet; the endpoints are maintained by hand against the backend's published spec (`http://localhost:7071/api/swagger.json`, or the dev API's `/api/swagger.json`).

---

*The rest of this file is the original Vite template text.*

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Where the product spec is

The Restaurant Ordering System is one product across several repositories, and almost every rule that
matters — how money is represented, how orders move, who may see what — cuts
across all of them. Keeping one copy of the spec is what stops several copies
drifting apart.

The spec is shared and lives in the **rs-backend** repo:

- in a checkout with the standard layout: `rs-backend/docs/spec.md` (sibling checkout)
- on GitHub: https://github.com/Fair-Technology/restaurant-ordering-system-backend/blob/main/docs/spec.md

Don't restate product rules here — a frontend only hides controls a user cannot
use; the rules are enforced in the backend. If you learn something new about how
the product behaves, edit the spec, not this file.

## Production promotion secret

The `Promote artifact to production` workflow (`.github/workflows/promote.yml`, runs on a `v*` tag after
approval on the `production` environment) deploys with a secret named **`AZURE_STATIC_WEB_APPS_API_TOKEN_PROD`**.
It must hold the **production** Static Web App's deployment token (Azure portal -> the production Static Web App
-> Overview -> Manage deployment token).

- **Where to add it:** GitHub repo -> Settings -> Environments -> `production` -> Environment secrets.
- **Dev is unaffected:** the dev workflow (`azure-static-web-apps.yml`) keeps using `AZURE_STATIC_WEB_APPS_API_TOKEN`.
- **Why a different name:** GitHub falls back to the repo-level secret when an environment has none of that name, so
  reusing the dev name would silently deploy production promotions to the DEV app.

> **Production promotion is EXPECTED TO FAIL until `AZURE_STATIC_WEB_APPS_API_TOKEN_PROD` exists.**
> A guard step fails the run with a message naming the secret. This is fail-closed by design, not a fault.
> The owner supplies the secret value; it is never committed or handled by tooling.
