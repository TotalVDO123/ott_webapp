import { useMutation } from 'react-query';
import { useCallback, useMemo, useState } from 'react';
import { getModule } from '@jwp/ott-common/src/modules/container';
import CheckoutController from '@jwp/ott-common/src/controllers/CheckoutController';

const useBillingPortal = () => {
  const checkoutController = getModule(CheckoutController);

  const [isRedirecting, setRedirecting] = useState(false);

  const billingPortalUrlRequest = useMutation({
    mutationKey: 'billing-portal',
    mutationFn: () => checkoutController.generateBillingPortalUrl(window.location.href),
  });

  const redirectToBillingPortal = useCallback(async () => {
    const billingPortalUrl = await billingPortalUrlRequest.mutateAsync();

    setRedirecting(true);

    if (billingPortalUrl) {
      window.location.href = billingPortalUrl;
    }
  }, [billingPortalUrlRequest]);

  const isLoading = billingPortalUrlRequest.isLoading || isRedirecting;

  return useMemo(() => ({ isLoading, redirectToBillingPortal }), [isLoading, redirectToBillingPortal]);
};

export default useBillingPortal;
