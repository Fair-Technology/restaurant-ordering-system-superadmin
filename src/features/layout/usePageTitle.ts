import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGetShopByIdQuery } from '../../services/api';

const BRAND = 'Superadmin';

/**
 * Sets document.title to "<Page> · <Shop name> · Superadmin" when a shop is in context
 * (reads :shopId from the route params) or "<Page> · Superadmin" otherwise.
 * Restores the previous title on unmount so a quick route flash doesn't leave a stale title.
 */
export function usePageTitle(pageName: string) {
  const { shopId } = useParams<{ shopId?: string }>();
  const { data: shop } = useGetShopByIdQuery({ shopId: shopId! }, { skip: !shopId });
  const shopName = shop?.name;
  useEffect(() => {
    const previous = document.title;
    document.title = shopName ? `${pageName} · ${shopName} · ${BRAND}` : `${pageName} · ${BRAND}`;
    return () => {
      document.title = previous;
    };
  }, [pageName, shopName]);
}
