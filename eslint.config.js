import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // `src/services/api.ts` is generated (see openapi/rtk-query.config.cjs) and is rewritten
  // wholesale on every regeneration, so it is not linted: any fix here would be lost.
  // `.harness` is the local browser-verification harness (stub MSAL, stub API, Playwright script),
  // not application code, so it is not linted.
  globalIgnores(['dist', 'src/services/api.ts', '.harness']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
