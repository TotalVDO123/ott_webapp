import React from 'react';
import { useTranslation } from 'react-i18next';
import useBillingPortal from '@jwp/ott-hooks-react/src/useBillingPortal';
import { useAccountStore } from '@jwp/ott-common/src/stores/AccountStore';

import styles from '../../pages/User/User.module.scss';
import Button from '../Button/Button';
import LoadingOverlay from '../LoadingOverlay/LoadingOverlay';

const WithActiveSubscription: React.FC<{ provider: string }> = ({ provider }) => {
  const { t } = useTranslation('user');

  const { isLoading, redirectToBillingPortal } = useBillingPortal();

  return (
    <div>
      <p>{t('subscription.subscription_text', { provider, provider_portal: t(`subscription.${provider.toLowerCase()}_portal`) })}</p>
      <Button label={t('subscription.goto_provider', { provider })} disabled={isLoading} onClick={redirectToBillingPortal} />
      {isLoading && <LoadingOverlay transparentBackground />}
    </div>
  );
};

const Subscription: React.FC = () => {
  const { t } = useTranslation('user');

  const { subscription, loading: isAccountLoading } = useAccountStore();

  if (isAccountLoading) {
    return <LoadingOverlay transparentBackground />;
  }

  const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'active_trial';

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2>{t('user:payment.subscription_details')}</h2>
      </div>
      {hasActiveSubscription ? (
        <WithActiveSubscription provider={subscription.paymentMethod} />
      ) : (
        <>
          <p>{t('user:payment.no_subscription_new_payment')}</p>
          <Button toModal="choose-offer" label={t('user:payment.view_plans')} />
        </>
      )}
    </section>
  );
};
export default Subscription;
