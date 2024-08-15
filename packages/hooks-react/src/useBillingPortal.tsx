import { useQuery, useQueryClient } from 'react-query';
import { useEffect } from 'react';
import { getModule } from '@jwp/ott-common/src/modules/container';
import CheckoutController from '@jwp/ott-common/src/controllers/CheckoutController';

const useBillingPortal = () => {
  const queryClient = useQueryClient();

  const checkoutController = getModule(CheckoutController);

  useEffect(
    () => () => {
      queryClient.invalidateQueries(['billing-portal']);
    },
    [queryClient],
  );

  return useQuery(['billing-portal'], () => checkoutController.generateBillingPortalUrl(window.location.href));
};

export default useBillingPortal;
