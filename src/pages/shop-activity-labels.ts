/**
 * Human labels for audit-log entries on the shop Activity Log.
 * Action labels are lowercase sentence fragments that read as "<actor> <label> <entity name>".
 */

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  product: 'Product',
  category: 'Category',
  shop: 'Shop',
  staff: 'Staff',
  subscription: 'Subscription',
  customer: 'Customer',
  order: 'Order',
  reference_lists: 'Reference list',
  role_permissions: 'Role permissions',
  platform_legal_identity: 'Platform legal identity',
};

export const ENTITY_TYPE_COLORS: Record<string, string> = {
  product: 'bg-blue-100 text-blue-700',
  category: 'bg-green-100 text-green-700',
  shop: 'bg-purple-100 text-purple-700',
  staff: 'bg-orange-100 text-orange-700',
  subscription: 'bg-pink-100 text-pink-700',
  customer: 'bg-teal-100 text-teal-700',
  order: 'bg-amber-100 text-amber-700',
};

export const ACTION_LABELS: Record<string, string> = {
  'product.create': 'created product',
  'product.update': 'updated product',
  'product.delete': 'deleted product',
  'category.create': 'created category',
  'category.update': 'updated category',
  'category.delete': 'deleted category',
  'shop.update': 'updated shop',
  'shop.logo': 'updated shop logo',
  'shop.legal_update': 'updated legal pages',
  'shop.dpa_accept': 'accepted the data processing agreement',
  'shop.data_export': 'exported restaurant data',
  'customer.erase': 'anonymised a customer',
  'shop.order_settings_update': 'updated order settings',
  'shop.busy_mode': 'switched busy mode',
  'shop.cover_image': 'updated cover image',
  'shop.cover_image_remove': 'removed cover image',
  'order.refund': 'refunded an order',
  'promotion.code_create': 'created a discount code',
  'promotion.code_update': 'switched a discount code on or off',
  'promotion.loyalty_update': 'changed the loyalty vouchers',
  'combo.create': 'created a combo',
  'combo.update': 'changed a combo',
  'subscription.override': 'changed the plan by hand',
  'subscription.cancelScheduled': 'scheduled a downgrade to the free plan',
  'subscription.cancelResumed': 'kept the paid plan',
  'subscription.limit_override': 'changed a plan limit for this restaurant',
  'subscription.limit_override_clear': "removed the restaurant's limit override",
  'subscription.upgrade': 'upgraded the plan',
  'subscription.change_scheduled': 'scheduled a downgrade',
  'subscription.change_cancelled': 'cancelled a scheduled downgrade',
  'subscription.payment_retried': 'paid an overdue invoice',
  'subscription.override_expired': 'manual plan expired',
  'shop.delete': 'deleted the restaurant',
  'shop.restore': 'restored the restaurant',
  // Superadmin sets how many missed orders in a row auto-pause ordering (0 = off); it does not pause.
  'shop.missed_orders_pause_limit': 'changed the missed-orders auto-pause limit',
  // Written by the system actor when the missed-orders streak hits the limit.
  'shop.orders_auto_paused': 'auto-paused ordering after missed orders',
  // Same action for taking the shop offline and for lifting it; the change rows show which.
  'shop.offline_by_superadmin': 'took the restaurant offline or back online',
  'shop.nameChange.requested': 'requested a name change',
  'shop.nameChange.approved': 'approved a name change',
  'shop.nameChange.rejected': 'rejected a name change',
  'staff.create': 'created a staff account',
  'staff.update': 'updated a staff account',
  'staff.delete': 'deleted a staff account',
  'staff.password_reset': 'reset a staff password',
  'reference_lists.update': 'updated the reference lists',
  'role_permissions.update': 'updated role permissions',
  'platform_legal_identity.update': 'updated the platform legal identity',
};

/** Sentence fragment for an audit action, or the raw key when there is no label. */
export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

/** Badge text for an audit entityType, or the raw value when there is no label. */
export function entityTypeLabel(entityType: string): string {
  return ENTITY_TYPE_LABELS[entityType] ?? entityType;
}
