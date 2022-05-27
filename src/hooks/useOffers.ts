import { useQueries } from 'react-query';
import { useEffect, useMemo, useState } from 'react';
import shallow from 'zustand/shallow';

import { useCheckoutStore } from '#src/stores/CheckoutStore';
import { getOffer } from '#src/services/checkout.service';
import { useConfigStore } from '#src/stores/ConfigStore';
import type { Offer } from '#types/checkout';
import type { OfferType } from '#types/account';
import { isSVODOffer } from '#src/utils/subscription';

const useOffers = () => {
  const integrations = useConfigStore(({ config }) => config?.integrations, shallow);
  const cleengSandbox = Boolean(integrations?.cleeng?.useSandbox);
  const monthlyOfferId = integrations?.cleeng?.monthlyOffer || '';
  const yearlyOfferId = integrations?.cleeng?.yearlyOffer || '';

  const { requestedMediaOffers } = useCheckoutStore(({ requestedMediaOffers }) => ({ requestedMediaOffers }), shallow);
  const hasPremierOffer = (requestedMediaOffers || []).some((offer) => offer.premier);
  const tvodOfferIds = (requestedMediaOffers || []).map(({ offerId }) => offerId);
  const [offerType, setOfferType] = useState<OfferType>('svod');

  const offerIds: string[] = useMemo(() => {
    return [...(requestedMediaOffers || []).map(({ offerId }) => offerId), monthlyOfferId, yearlyOfferId].filter(Boolean);
  }, [requestedMediaOffers, monthlyOfferId, yearlyOfferId]);

  const offerQueries = useQueries(
    offerIds.map((offerId) => ({
      queryKey: ['offer', offerId],
      queryFn: () => getOffer({ offerId }, cleengSandbox),
      enabled: !!offerId,
    })),
  );

  const isLoading = offerQueries.some(({ isLoading }) => isLoading);

  useEffect(() => {
    if (isLoading) return;
    if (hasPremierOffer) setOfferType('tvod');
  }, [isLoading, hasPremierOffer, setOfferType]);

  // The `offerQueries` variable mutates on each render which prevents the useMemo to work properly.
  return useMemo(() => {
    const allOffers = offerQueries.reduce<Offer[]>((prev, cur) => (cur.isSuccess && cur.data?.responseData ? [...prev, cur.data.responseData] : prev), []);
    const offers = allOffers.filter((offer) => (offerType === 'tvod' ? !isSVODOffer(offer) : isSVODOffer(offer)));
    const offersDict = Object.fromEntries(offers.map((offer) => [offer.offerId, offer]));
    const defaultOfferId = hasPremierOffer ? tvodOfferIds[0] : yearlyOfferId || monthlyOfferId;

    return {
      hasTVODOffers: allOffers.some((offer) => !isSVODOffer(offer)),
      isLoading,
      hasPremierOffer,
      defaultOfferId,
      offerType,
      setOfferType,
      offers,
      offersDict,
    };
  }, [requestedMediaOffers, offerQueries]);
};

export default useOffers;
