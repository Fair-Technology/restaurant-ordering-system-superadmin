import { api } from './api';

/**
 * Cache-invalidation fixes the generated client cannot express.
 *
 * Codegen takes tags from the OpenAPI operation tags, and the backend tags most superadmin
 * operations with a catch-all "Default". That is coarse but self-consistent, except where a
 * mutation must refresh a query that lives under a different tag: approving or rejecting a
 * name change changes `pendingNameChange` on the shops list, which is tagged "Shops".
 * Without this the pending row stays on screen until a reload.
 *
 * Lives outside `api.ts` because that file is rewritten on every regeneration.
 */
export const tagOverrides = api.enhanceEndpoints({
  endpoints: {
    approveShopNameChange: { invalidatesTags: ['Shops'] },
    rejectShopNameChange: { invalidatesTags: ['Shops'] },
  },
});
