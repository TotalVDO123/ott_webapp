import { useQueries } from 'react-query';
import shallow from 'zustand/shallow';

import type { MediaOffer } from '#types/media';
import type { GetEntitlementsResponse } from '#types/checkout';
import type { PlaylistItem } from '#types/playlist';
import { isLocked } from '#src/utils/entitlements';
import { useConfigStore } from '#src/stores/ConfigStore';
import { useAccountStore } from '#src/stores/AccountStore';
import { getEntitlements } from '#src/services/checkout.service';

export type UseEntitlementResult = {
  isEntitled: boolean;
  isMediaEntitlementLoading: boolean;
  mediaOffers: MediaOffer[];
};

export type UseEntitlement = (playlistItem?: PlaylistItem) => UseEntitlementResult;

type QueryResult = {
  responseData?: GetEntitlementsResponse;
};

/**
 * useEntitlement()
 *
 * Free items: Access
 * AVOD - Regular items free, TVOD items need entitlement
 * AuthVOD - For regular items user should be logged in, TVOD items need entitlement
 * SVOD - For regular items user should have subscription OR entitlement, premier items need entitlement
 *
 *  */
const useEntitlement: UseEntitlement = (playlistItem) => {
  const { sandbox, accessModel } = useConfigStore(
    ({ config, accessModel }) => ({
      sandbox: Boolean(config?.integrations?.cleeng?.useSandbox),
      accessModel,
    }),
    shallow,
  );
  const { user, subscription, transactions, auth } = useAccountStore(
    ({ user, subscription, transactions, auth }) => ({ user, subscription, transactions, auth }),
    shallow,
  );

  const isPreEntitled = playlistItem && !isLocked(accessModel, !!user, !!subscription, playlistItem);
  const mediaOffers = playlistItem?.mediaOffers || [];

  // This entitlement query is invalidated by adding all transaction IDs to the queryKey. Perhaps a more optimal way is
  // to invalidate the query cache after the payment.
  const mediaEntitlementQueries = useQueries(
    mediaOffers.map(({ offerId }) => ({
      queryKey: ['mediaOffer', offerId, transactions?.map((t) => t.transactionId).join(',')],
      queryFn: () => getEntitlements({ offerId }, sandbox, auth?.jwt || ''),
      enabled: !!playlistItem && !!auth?.jwt && !!offerId && !isPreEntitled,
    })),
  );

  const isMediaEntitled = mediaEntitlementQueries.some((item) => item.isSuccess && (item.data as QueryResult)?.responseData?.accessGranted);
  const isMediaEntitlementLoading = !isMediaEntitled && mediaEntitlementQueries.some((item) => item.isLoading);

  const isEntitled = !!playlistItem && (isPreEntitled || isMediaEntitled);

  return { isEntitled, isMediaEntitlementLoading, mediaOffers };
};

export default useEntitlement;
