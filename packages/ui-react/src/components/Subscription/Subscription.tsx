import React from 'react';
import { useTranslation } from 'react-i18next';
import useBillingPortal from '@jwp/ott-hooks-react/src/useBillingPortal';
import type { Subscription as SubscriptionType } from '@jwp/ott-common/types/subscription';
import { formatLocalizedDate, formatPrice } from '@jwp/ott-common/src/utils/formatting';

import userStyles from '../../pages/User/User.module.scss';
import Button from '../Button/Button';
import LoadingOverlay from '../LoadingOverlay/LoadingOverlay';

import styles from './Subscription.module.scss';

const ActiveSubscription: React.FC<{ subscription: SubscriptionType }> = ({ subscription }) => {
  const { t, i18n } = useTranslation('user');

  const { isLoading, redirectToBillingPortal } = useBillingPortal();

  return (
    <div>
      <div className={styles.infoBox} key={subscription.offerId}>
        <p>
          <strong>{subscription.offerTitle}</strong> <br />
          {subscription.status === 'active'
            ? t('user:payment.next_billing_date_on', { date: formatLocalizedDate(new Date(subscription.expiresAt * 1000), i18n.language) })
            : t('user:payment.subscription_expires_on', { date: formatLocalizedDate(new Date(subscription.expiresAt * 1000), i18n.language) })}
        </p>
        <p className={styles.price}>
          <strong>{formatPrice(subscription.nextPaymentPrice, subscription.nextPaymentCurrency, 'MK')}</strong>
          <small>/{t(`account:periods.${subscription.period}`)}</small>
        </p>
      </div>
      <p>{t(`subscription.${subscription.paymentGateway}.explanation`)}</p>
      <Button label={t(`subscription.${subscription.paymentGateway}.goto_provider`)} disabled={isLoading} onClick={redirectToBillingPortal} />
      {isLoading && <LoadingOverlay transparentBackground />}
    </div>
  );
};

type Props = {
  subscription: SubscriptionType | null;
};

const Subscription: React.FC<Props> = ({ subscription }) => {
  const { t } = useTranslation('user');

  const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'active_trial';

  return (
    <section className={userStyles.panel}>
      <div className={userStyles.panelHeader}>
        <h2>{t('user:payment.subscription_details')}</h2>
      </div>
      {hasActiveSubscription ? (
        <ActiveSubscription subscription={subscription} />
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
