import type { ShopSummaryDto } from '../services/api';

export type ShopStatusKind = 'online' | 'offline-owner' | 'offline-platform';

export interface ShopStatus {
  kind: ShopStatusKind;
  label: string;
  ordersPaused: boolean;
}

type StatusInput = Partial<Pick<ShopSummaryDto, 'isPaused' | 'ordersPaused' | 'offlineBySuperadmin'>>;

/** Platform offline wins over owner offline: the owner cannot undo it. */
export const getShopStatus = (shop: StatusInput): ShopStatus => {
  const ordersPaused = shop.ordersPaused === true;
  if (shop.offlineBySuperadmin) {
    return { kind: 'offline-platform', label: 'Offline (platform)', ordersPaused };
  }
  if (shop.isPaused) {
    return { kind: 'offline-owner', label: 'Offline (owner)', ordersPaused };
  }
  return { kind: 'online', label: 'Online', ordersPaused };
};

/** Row action label for toggling the platform offline lock. */
export const offlineActionLabel = (
  shop: StatusInput,
  status: Pick<ShopStatus, 'kind'>,
): string => {
  if (shop.offlineBySuperadmin) return 'Bring back online';
  return status.kind === 'offline-owner' ? 'Force offline' : 'Take offline';
};

export const SUPERADMIN_REASON_MAX = 500;
