import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useBillingPortal from '@jwp/ott-hooks-react/src/useBillingPortal';
import { useAccountStore } from '@jwp/ott-common/src/stores/AccountStore';
import { useNavigate, useLocation } from 'react-router';

import styles from '../../pages/User/User.module.scss';
import Button from '../Button/Button';
import LoadingOverlay from '../LoadingOverlay/LoadingOverlay';
import { modalURLFromLocation } from '../../utils/location';

const Subscription: React.FC = () => {
  const { t } = useTranslation('user');

  const [isBusy, setBusy] = useState(false);
  const { subscription: activeSubscription } = useAccountStore();

  const navigate = useNavigate();
  const location = useLocation();
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

  const test = true;

  const provider = activeSubscription?.paymentMethod;
  return activeSubscription?.status === 'active' || activeSubscription?.status === 'active_trial' || test ? (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2>{t('user:payment.subscription_details')}</h2>
      </div>
      <div>
        <p>{t('subscription.subscription_text', { provider, provider_portal: t(`subscription.${provider?.toLowerCase()}_portal`) })}</p>
        <Button label={isBusy ? t('subscription.redirecting') : t('subscription.goto_provider', { provider })} disabled={isBusy} onClick={onClick} />
      </div>
    </section>
  ) : isLoading ? (
    null || !test
  ) : (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2>{t('user:payment.subscription_details')}</h2>
      </div>
      <p>{t('user:payment.no_subscription_new_payment')}</p>
      <Button
        onClick={() => {
          navigate(modalURLFromLocation(location, 'choose-offer'));
        }}
        label={t('user:payment.view_plans')}
      />
    </section>
  );
};
export default Subscription;
