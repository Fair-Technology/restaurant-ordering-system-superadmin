import { useGetShopByIdQuery } from '../services/api';

/**
 * Shop name for a shopId, fetched/cached via RTK Query (so it works on direct navigation
 * and refresh, unlike router `location.state`). Undefined while loading or on error.
 */
export function useShopName(shopId: string | undefined): string | undefined {
  const { data } = useGetShopByIdQuery({ shopId: shopId! }, { skip: !shopId });
  return data?.name;
}
