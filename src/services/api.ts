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
  actorId: string;
  actorEmail?: string;
  actorName?: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  changes?: AuditChange[];
  ipAddress?: string;
  userAgent?: string;
  ttl: number;
}

export interface AuditEntriesResponse {
  entries: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
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
  createdAt: string;
  updatedAt: string;
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
    getShopSubscription: build.query<{ subscription: ShopSubscriptionResponse; plan: PlanResponse | null }, { shopId: string }>({
      query: ({ shopId }) => `/shops/${shopId}/subscription`,
      providesTags: (_result, _err, { shopId }) => [{ type: 'Subscriptions', id: shopId }],
    }),
    overrideShopSubscription: build.mutation<{ subscription: ShopSubscriptionResponse }, { shopId: string; overrideRequest: { planId: string; overrideReason: string; overrideExpiresAt?: string | null } }>({
      query: ({ shopId, overrideRequest }) => ({ url: `/shops/${shopId}/subscription/override`, method: 'POST', body: overrideRequest }),
      invalidatesTags: (_result, _err, { shopId }) => [{ type: 'Subscriptions', id: shopId }],
    }),
    // Usage
    getShopUsage: build.query<{ usage: ShopUsageResponse; ordersPerMonthLimit: number | null }, { shopId: string }>({
      query: ({ shopId }) => `/shops/${shopId}/usage`,
      providesTags: (_result, _err, { shopId }) => [{ type: 'Usage', id: shopId }],
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
  useGetShopUsageQuery,
  useReconcileShopUsageMutation,
  useGetOrdersByShopQuery,
  useApproveShopNameChangeMutation,
  useRejectShopNameChangeMutation,
} = api;
