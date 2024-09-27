import { useMutation } from 'react-query';
import { getModule } from '@jwp/ott-common/src/modules/container';
import CheckoutController from '@jwp/ott-common/src/controllers/CheckoutController';

const useBillingPortalURL = () => {
  const checkoutController = getModule(CheckoutController);

  return useMutation({
    mutationKey: 'billing-portal',
    mutationFn: checkoutController.generateBillingPortalUrl,
  });
};

export default useBillingPortalURL;
