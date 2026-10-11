import type { ShopResponse } from '../services/api';

export type ShopStatusKind = 'online' | 'offline-owner' | 'offline-platform';

export interface ShopStatus {
  kind: ShopStatusKind;
  label: string;
  ordersPaused: boolean;
}

type StatusInput = Pick<ShopResponse, 'isPaused' | 'ordersPaused' | 'offlineBySuperadmin'>;

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

export const SUPERADMIN_REASON_MAX = 500;
