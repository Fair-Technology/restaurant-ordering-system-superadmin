import { baseApi } from './baseApi';

export interface UserProfileResponse {
  id: string;
  email?: string;
  name?: string;
  systemRole: 'user' | 'superadmin';
  createdAt: string;
  updatedAt: string;
}

export interface PendingNameChange {
  requestedName: string;
  requestedSlug: string;
  requestedBy: string;
  requestedAt: string;
}

export interface ShopResponse {
  id: string;
  name: string;
  slug: string;
  isDeleted: boolean;
  currency?: string;
  createdAt: string;
  updatedAt: string;
  pendingNameChange?: PendingNameChange | null;
}

export interface ShopsListResponse {
  shops: ShopResponse[];
  total: number;
}

export interface AuditChange {
  field: string;
  from: unknown;
  to: unknown;
}

export interface AuditEntry {
  id: string;
  shopId: string;
  timestamp: string;
  actorType: 'owner' | 'staff' | 'superadmin' | 'system';
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  changes?: AuditChange[];
}

export interface AuditEntriesResponse {
  entries: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
  actorLabels: Record<string, string>;
}

// Plan types
export interface PlanLimitResponse {
  key: string;
  value: number;
}

export interface PlanResponse {
  id: string;
  name: string;
  internalKey: string;
  isDefault: boolean;
  isVisible: boolean;
  sortOrder: number;
  limits: PlanLimitResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface PlanPricingResponse {
  id: string;
  planId: string;
  currency: string;
  monthlyAmountCents: number;
  yearlyAmountCents: number;
  billingPriceIdMonthly: string | null;
  billingPriceIdYearly: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionStatus = 'free' | 'active' | 'past_due' | 'canceled' | 'expired';
export type PlanSource = 'default' | 'billing' | 'superadmin_override';

export interface ShopSubscriptionResponse {
  id: string;
  shopId: string;
  planId: string;
  status: SubscriptionStatus;
  billingInterval: 'monthly' | 'yearly' | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  billingCustomerId: string | null;
  billingSubscriptionId: string | null;
  cancelAtPeriodEnd: boolean;
  planSource: PlanSource;
  overriddenBy: string | null;
  overrideReason: string | null;
  overrideExpiresAt: string | null;
  limitOverride?: LimitOverrideResponse | null;
  planBeforeOverride?: string | null;
  scheduledChange?: ScheduledPlanChangeResponse | null;
  paymentFailedAt?: string | null;
  graceWarningsSent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledPlanChangeResponse {
  planId: string;
  billingInterval: 'monthly' | 'yearly';
  effectiveAt: string;
}

export interface LimitOverrideResponse {
  limits: PlanLimitResponse[];
  reason: string;
  expiresAt: string | null;
  setBy: string;
  setAt: string;
}

export interface EntitlementsResponse {
  planId: string;
  limits: Record<string, number>;
  limitOverrideActive: boolean;
  planOverrideExpired: boolean;
  graceEndsAt?: string | null;
  droppedForNonPayment?: boolean;
}

export type WarningLevel = 0 | 80 | 90 | 95 | 100;

export interface OrderLimitStatus {
  periodKey: string;
  acceptedOrderCount: number;
  limit: number | null;
  warningLevel: WarningLevel;
  limitReached: boolean;
}

export type RejectionFlag = 'high_rate' | 'spike_near_limit';

export interface RejectionStats {
  windowDays: number;
  accepted: number;
  rejectedByRestaurant: number;
  rate: number | null;
  recentRejections: number;
  flags: RejectionFlag[];
}

export interface RejectionWatchRow {
  shopId: string;
  name: string;
  slug: string;
  orderLimit: OrderLimitStatus;
  rejections: RejectionStats;
}

export interface ShopUsageResponse {
  shopId: string;
  periodKey: string;
  acceptedOrderCount: number;
  lastReconciled: string | null;
  updatedAt: string;
}

export interface OrderItemDto {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface OrderDto {
  id: string;
  orderRef: string;
  displayState: string;
  fulfilmentMode: string;
  paymentStatus: string;
  items: OrderItemDto[];
  subtotalCents: number;
  totalCents?: number;
  currency: string;
  customerName?: string;
  customerEmail?: string;
  createdAt: string;
}

export interface OrdersListResponse {
  orders: OrderDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RolePermissionsResponse {
  owner: string[];
  manager: string[];
  staff: string[];
  updatedAt: string | null;
}

// Reference lists (allergens, additives, tax classes and tax rates)
export interface LocalizedLabel {
  de: string;
  en: string;
}

export interface ReferenceEntry {
  id: string;
  labels: LocalizedLabel;
  isActive: boolean;
}

export interface AdditiveEntry extends ReferenceEntry {
  code: number;
}

export type FulfilmentModeKey = 'collection' | 'delivery' | 'dine_in';

export interface TaxRateRowDto {
  taxClassId: string;
  fulfilmentMode: FulfilmentModeKey;
  rateBasisPoints: number;
  effectiveFrom: string;
}

export interface ReferenceListsUpdateBody {
  allergens: ReferenceEntry[];
  additives: AdditiveEntry[];
  taxClasses: ReferenceEntry[];
  defaultTaxClassId: string | null;
  taxRates: TaxRateRowDto[];
}

export interface ReferenceListsResponse extends ReferenceListsUpdateBody {
  countryCode: string;
  currentTaxRates: { taxClassId: string; rates: Record<FulfilmentModeKey, number | null> }[];
  taxRatesUniformAcrossModes: boolean;
  updatedAt: string | null;
}

// Platform legal identity (who the platform is, shown in every restaurant's privacy notice)
export interface PlatformOperator {
  legalName: string;
  address: string;
  email: string;
}

export interface EuRepresentative {
  name: string;
  address: string;
  email: string;
}

export interface PlatformLegalIdentityUpdateBody {
  platformName: string;
  salesSiteUrl: string | null;
  operator: PlatformOperator;
  euRepresentative: EuRepresentative | null;
}

export interface PlatformLegalIdentityResponse extends PlatformLegalIdentityUpdateBody {
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface SubProcessorDto {
  id: 'azure' | 'entra' | 'acs';
  name: string;
  purpose: LocalizedLabel;
  location: LocalizedLabel;
}

export interface PlatformLegalPublicResponse {
  platformName: string;
  salesSiteUrl: string | null;
  operator: PlatformOperator;
  euRepresentative: EuRepresentative | null;
  subProcessors: SubProcessorDto[];
  currentDpaVersion: string;
  currentDpaIsDraft: boolean;
}

export const api = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<UserProfileResponse, void>({
      query: () => '/users/me',
      providesTags: ['UserProfile'],
    }),
    getShops: build.query<ShopsListResponse, void>({
      query: () => '/shops',
      providesTags: ['Shops'],
    }),
    getAuditEntriesByShop: build.query<
      AuditEntriesResponse,
      { shopId: string; page?: number; pageSize?: number }
    >({
      query: ({ shopId, page = 1, pageSize = 20 }) =>
        `/shops/${shopId}/audit?page=${page}&pageSize=${pageSize}`,
      providesTags: (_result, _err, { shopId }) => [{ type: 'AuditEntries', id: shopId }],
    }),
    // Plans
    getPlans: build.query<{ plans: PlanResponse[] }, void>({
      query: () => '/plans',
      providesTags: ['Plans'],
    }),
    getPlan: build.query<{ plan: PlanResponse; pricing: PlanPricingResponse[] }, { planId: string }>({
      query: ({ planId }) => `/plans/${planId}`,
      providesTags: (_result, _err, { planId }) => [{ type: 'Plans', id: planId }],
    }),
    createPlan: build.mutation<{ plan: PlanResponse }, { createPlanRequest: { name: string; internalKey: string; isDefault?: boolean; isVisible?: boolean; sortOrder?: number; limits?: PlanLimitResponse[] } }>({
      query: ({ createPlanRequest }) => ({ url: '/plans', method: 'POST', body: createPlanRequest }),
      invalidatesTags: ['Plans'],
    }),
    updatePlan: build.mutation<{ plan: PlanResponse }, { planId: string; updatePlanRequest: { name?: string; isVisible?: boolean; sortOrder?: number; limits?: PlanLimitResponse[] } }>({
      query: ({ planId, updatePlanRequest }) => ({ url: `/plans/${planId}`, method: 'PATCH', body: updatePlanRequest }),
      invalidatesTags: (_result, _err, { planId }) => [{ type: 'Plans', id: planId }, 'Plans'],
    }),
    getPlanPricing: build.query<PlanPricingResponse[], { planId: string }>({
      query: ({ planId }) => `/plans/${planId}/pricing`,
      providesTags: (_result, _err, { planId }) => [{ type: 'Plans', id: `pricing-${planId}` }],
    }),
    setPlanPricing: build.mutation<{ pricing: PlanPricingResponse }, { planId: string; setPlanPricingRequest: { currency: string; monthlyAmountCents: number; yearlyAmountCents: number; billingPriceIdMonthly?: string | null; billingPriceIdYearly?: string | null } }>({
      query: ({ planId, setPlanPricingRequest }) => ({ url: `/plans/${planId}/pricing`, method: 'POST', body: setPlanPricingRequest }),
      invalidatesTags: (_result, _err, { planId }) => [{ type: 'Plans', id: `pricing-${planId}` }],
    }),
    // Subscriptions
    getShopSubscription: build.query<{ subscription: ShopSubscriptionResponse; plan: PlanResponse | null; entitlements: EntitlementsResponse }, { shopId: string }>({
      query: ({ shopId }) => `/shops/${shopId}/subscription`,
      providesTags: (_result, _err, { shopId }) => [{ type: 'Subscriptions', id: shopId }],
    }),
    overrideShopSubscription: build.mutation<{ subscription: ShopSubscriptionResponse }, { shopId: string; overrideRequest: { planId: string; overrideReason: string; overrideExpiresAt?: string | null } }>({
      query: ({ shopId, overrideRequest }) => ({ url: `/shops/${shopId}/subscription/override`, method: 'POST', body: overrideRequest }),
      invalidatesTags: (_result, _err, { shopId }) => [{ type: 'Subscriptions', id: shopId }],
    }),
    setLimitOverride: build.mutation<{ subscription: ShopSubscriptionResponse }, { shopId: string; body: { limits: PlanLimitResponse[]; reason: string; expiresAt?: string | null } }>({
      query: ({ shopId, body }) => ({ url: `/shops/${shopId}/subscription/limit-override`, method: 'PUT', body }),
      invalidatesTags: (_result, _err, { shopId }) => [{ type: 'Subscriptions', id: shopId }],
    }),
    clearLimitOverride: build.mutation<{ subscription: ShopSubscriptionResponse }, { shopId: string }>({
      query: ({ shopId }) => ({ url: `/shops/${shopId}/subscription/limit-override`, method: 'DELETE' }),
      invalidatesTags: (_result, _err, { shopId }) => [{ type: 'Subscriptions', id: shopId }],
    }),
    // Usage
    getShopUsage: build.query<{ usage: ShopUsageResponse; ordersPerMonthLimit: number | null; orderLimit: OrderLimitStatus; rejections: RejectionStats }, { shopId: string }>({
      query: ({ shopId }) => `/shops/${shopId}/usage`,
      providesTags: (_result, _err, { shopId }) => [{ type: 'Usage', id: shopId }],
    }),
    getRejectionWatch: build.query<{ shops: RejectionWatchRow[] }, void>({
      query: () => '/usage/rejection-watch',
      providesTags: ['Usage'],
    }),
    reconcileShopUsage: build.mutation<{ usage: ShopUsageResponse; reconciledCount: number }, { shopId: string }>({
      query: ({ shopId }) => ({ url: `/shops/${shopId}/usage/reconcile`, method: 'POST' }),
      invalidatesTags: (_result, _err, { shopId }) => [{ type: 'Usage', id: shopId }],
    }),
    // Orders
    getOrdersByShop: build.query<OrdersListResponse, { shopId: string; page?: number; pageSize?: number }>({
      query: ({ shopId, page = 1, pageSize = 20 }) =>
        `/shops/${shopId}/orders?page=${page}&pageSize=${pageSize}`,
      providesTags: (_r, _e, { shopId }) => [{ type: 'Orders', id: shopId }],
    }),
    // Name change requests
    approveShopNameChange: build.mutation<
      { id: string; name: string; slug: string; updatedAt: string },
      { shopId: string }
    >({
      query: ({ shopId }) => ({
        url: `/shops/${shopId}/name-change-request/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['Shops'],
    }),
    rejectShopNameChange: build.mutation<{ id: string; updatedAt: string }, { shopId: string }>({
      query: ({ shopId }) => ({
        url: `/shops/${shopId}/name-change-request`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Shops'],
    }),
    // Role permissions
    getRolePermissions: build.query<RolePermissionsResponse, void>({
      query: () => '/platform/role-permissions',
      providesTags: ['RolePermissions'],
    }),
    updateRolePermissions: build.mutation<RolePermissionsResponse, { manager: string[]; staff: string[] }>({
      query: (body) => ({ url: '/platform/role-permissions', method: 'PUT', body }),
      invalidatesTags: ['RolePermissions'],
    }),
    // Reference lists
    getReferenceLists: build.query<ReferenceListsResponse, { countryCode: string }>({
      query: ({ countryCode }) => `/reference-lists/${countryCode}`,
      providesTags: (_result, _err, { countryCode }) => [{ type: 'ReferenceLists', id: countryCode }],
    }),
    updateReferenceLists: build.mutation<
      ReferenceListsResponse,
      { countryCode: string; body: ReferenceListsUpdateBody }
    >({
      query: ({ countryCode, body }) => ({
        url: `/platform/reference-lists/${countryCode}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _err, { countryCode }) => [{ type: 'ReferenceLists', id: countryCode }],
    }),
    // Platform legal identity
    getPlatformLegalIdentity: build.query<PlatformLegalIdentityResponse, void>({
      query: () => '/platform/legal-identity',
      providesTags: ['PlatformLegal'],
    }),
    updatePlatformLegalIdentity: build.mutation<PlatformLegalIdentityResponse, PlatformLegalIdentityUpdateBody>({
      query: (body) => ({ url: '/platform/legal-identity', method: 'PUT', body }),
      invalidatesTags: ['PlatformLegal'],
    }),
    getPlatformLegalPublic: build.query<PlatformLegalPublicResponse, void>({
      query: () => '/legal/platform',
      providesTags: ['PlatformLegal'],
    }),
  }),
});

export const {
  useGetMeQuery,
  useGetShopsQuery,
  useGetAuditEntriesByShopQuery,
  useGetPlansQuery,
  useGetPlanQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useGetPlanPricingQuery,
  useSetPlanPricingMutation,
  useGetShopSubscriptionQuery,
  useOverrideShopSubscriptionMutation,
  useSetLimitOverrideMutation,
  useClearLimitOverrideMutation,
  useGetShopUsageQuery,
  useGetRejectionWatchQuery,
  useReconcileShopUsageMutation,
  useGetOrdersByShopQuery,
  useApproveShopNameChangeMutation,
  useRejectShopNameChangeMutation,
  useGetRolePermissionsQuery,
  useUpdateRolePermissionsMutation,
  useGetReferenceListsQuery,
  useUpdateReferenceListsMutation,
  useGetPlatformLegalIdentityQuery,
  useUpdatePlatformLegalIdentityMutation,
  useGetPlatformLegalPublicQuery,
} = api;
