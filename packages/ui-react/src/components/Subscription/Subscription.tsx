import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useBillingPortal from '@jwp/ott-hooks-react/src/useBillingPortal';

import Button from '../Button/Button';
import LoadingOverlay from '../LoadingOverlay/LoadingOverlay';

const Subscription: React.FC = () => {
  const { t } = useTranslation('user');

  const [isBusy, setBusy] = useState(false);

  const { isLoading, isFetching, data: billingPortalUrl } = useBillingPortal();

  if (isLoading || isFetching) {
    return <LoadingOverlay transparentBackground />;
  }

  const onClick = async () => {
    if (billingPortalUrl) {
      setBusy(true);
      window.location.href = billingPortalUrl;
    }
  };

  // todo: apply logic for retrieving the actual provider name
  const provider = 'Stripe';

  return (
    <section>
      <div>
        <p>{t('subscription.subscription_text', { provider, provider_portal: t(`subscription.${provider.toLowerCase()}_portal`) })}</p>
        <Button label={isBusy ? t('subscription.redirecting') : t('subscription.goto_provider', { provider })} disabled={isBusy} onClick={onClick} />
      </div>
    </section>
  );
};

export default Subscription;
