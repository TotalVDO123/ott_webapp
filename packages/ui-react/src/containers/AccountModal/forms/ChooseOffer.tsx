import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { mixed, object } from 'yup';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import type { ChooseOfferFormData, Offer, OfferType } from '@jwp/ott-common/types/checkout';
import { modalURLFromLocation } from '@jwp/ott-ui-react/src/utils/location';
import useOffers from '@jwp/ott-hooks-react/src/useOffers';
import useForm from '@jwp/ott-hooks-react/src/useForm';
import { useAccountStore } from '@jwp/ott-common/src/stores/AccountStore';
import { useCheckoutStore } from '@jwp/ott-common/src/stores/CheckoutStore';

import ChooseOfferForm from '../../../components/ChooseOfferForm/ChooseOfferForm';
import LoadingOverlay from '../../../components/LoadingOverlay/LoadingOverlay';
import ChoosePlanForm from '../../../components/ChoosePlanForm/ChoosePlanForm';
import useQueryParam from '../../../hooks/useQueryParam';

const ChooseOffer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('account');
  const isSwitch = useQueryParam('u') === 'upgrade-subscription';
  const isPendingOffer = useAccountStore(({ pendingOffer }) => ({ isPendingOffer: !!pendingOffer }));
  const accessMethod = useCheckoutStore((state) => state.accessMethod);
  const redirectUrlRef = useRef<string>('');

  const { isLoading, mediaOffers, subscriptionOffers, switchSubscriptionOffers, defaultOfferType, hasMultipleOfferTypes, chooseOffer, switchSubscription } =
    useOffers();

  const checkoutUrl = modalURLFromLocation(location, 'checkout');
  const upgradePendingUrl = modalURLFromLocation(location, 'upgrade-subscription-pending');
  const upgradeSuccessUrl = modalURLFromLocation(location, 'upgrade-subscription-success');
  const upgradeErrorUrl = modalURLFromLocation(location, 'upgrade-subscription-error');

  const { values, errors, submitting, setValue, handleSubmit, handleChange } = useForm<ChooseOfferFormData>({
    initialValues: { selectedOfferType: defaultOfferType, selectedOfferId: undefined },
    validationSchema: object().shape({
      selectedOfferId: mixed<string>().required(t('choose_offer.field_required')),
      selectedOfferType: mixed<OfferType>().required(t('choose_offer.field_required')),
    }),
    onSubmit: async ({ selectedOfferType, selectedOfferId }) => {
      if (!selectedOfferType || !selectedOfferId) return;

      const offer = visibleOffers.find((offer) => offer.offerId === selectedOfferId);

      if (!offer) return;

      const baseUrl = window.location.href.split('/?')[0];

      const url = await chooseOffer.mutateAsync({
        offer,
        successUrl: `${baseUrl}${modalURLFromLocation(location, 'welcome')}`,
        cancelUrl: `${baseUrl}${modalURLFromLocation(location, 'payment-error')}`,
      });

      if (url) {
        redirectUrlRef.current = url;
      }

      if (isSwitch) {
        return await switchSubscription.mutateAsync();
      }
    },
    onSubmitSuccess: async () => {
      if (accessMethod === 'plan') {
        if (redirectUrlRef.current) {
          window.location.href = redirectUrlRef.current;
        }

        return;
      }

      if (isSwitch) {
        if (isPendingOffer) {
          return navigate(upgradePendingUrl);
        }

        return navigate(upgradeSuccessUrl);
      }

      navigate(checkoutUrl);
    },
    onSubmitError: () => navigate(upgradeErrorUrl),
  });

  const visibleOffers = values.selectedOfferType === 'tvod' ? mediaOffers : isSwitch ? switchSubscriptionOffers : subscriptionOffers;

  const offersRef = useRef<Offer[]>([]);

  useEffect(() => {
    if (isLoading || !visibleOffers.length) return;

    const offerId = visibleOffers[visibleOffers.length - 1]?.offerId;

    setValue('selectedOfferId', offerId);
  }, [visibleOffers, values.selectedOfferType, setValue, isLoading]);

  useEffect(() => {
    if (isLoading || !defaultOfferType) return;

    setValue('selectedOfferType', defaultOfferType);
  }, [isLoading, defaultOfferType, setValue]);

  useLayoutEffect(() => {
    offersRef.current = defaultOfferType === 'tvod' ? mediaOffers : isSwitch ? switchSubscriptionOffers : subscriptionOffers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultOfferType]);

  // loading state
  if (isLoading || redirectUrlRef.current) {
    return (
      <div style={{ height: 300 }}>
        <LoadingOverlay inline />
      </div>
    );
  }

  if (accessMethod === 'plan') {
    return (
      <ChoosePlanForm
        values={values}
        errors={errors}
        onChange={handleChange}
        setValue={setValue}
        onSubmit={handleSubmit}
        offers={visibleOffers}
        submitting={submitting}
      />
    );
  }

  return (
    <ChooseOfferForm
      onSubmit={handleSubmit}
      onChange={handleChange}
      values={values}
      errors={errors}
      submitting={submitting}
      offers={visibleOffers}
      showOfferTypeSwitch={hasMultipleOfferTypes}
    />
  );
};

export default ChooseOffer;
