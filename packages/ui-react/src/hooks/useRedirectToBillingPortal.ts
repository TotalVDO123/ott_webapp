import { useCallback, useMemo, useState } from 'react';
import useBillingPortalURL from '@jwp/ott-hooks-react/src/useBillingPortalURL';

const useRedirectToBillingPortal = () => {
  const billingPortalURLmutation = useBillingPortalURL();

  const [isRedirecting, setRedirecting] = useState(false);

  const redirectToBillingPortal = useCallback(async () => {
    const billingPortalUrl = await billingPortalURLmutation.mutateAsync();

    setRedirecting(true);

    if (billingPortalUrl) {
      window.location.href = billingPortalUrl;
    }
  }, [billingPortalURLmutation]);

  const isLoading = billingPortalURLmutation.isLoading || isRedirecting;

  return useMemo(() => ({ isLoading, redirectToBillingPortal }), [isLoading, redirectToBillingPortal]);
};

export default useRedirectToBillingPortal;
