import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Subscription as SubscriptionType } from '@jwp/ott-common/types/subscription';
import { formatLocalizedDate, formatPrice } from '@jwp/ott-common/src/utils/formatting';
import { useConfigStore } from '@jwp/ott-common/src/stores/ConfigStore';
import { modalURLFromLocation } from '@jwp/ott-ui-react/src/utils/location';

import useRedirectToBillingPortal from '../../hooks/useRedirectToBillingPortal';
import userStyles from '../../pages/User/User.module.scss';
import Button from '../Button/Button';
import LoadingOverlay from '../LoadingOverlay/LoadingOverlay';

import styles from './Subscription.module.scss';

const ActiveSubscription: React.FC<{ subscription: SubscriptionType }> = ({ subscription }) => {
  const { t, i18n } = useTranslation('user');
  const isAccessBridgeEnabled = useConfigStore((state) => !!state.settings?.apiAccessBridgeUrl);

  const { isLoading, redirectToBillingPortal } = useRedirectToBillingPortal();

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
      {isAccessBridgeEnabled && (
        <>
          <p>{t(`subscription.${subscription.paymentGateway}.explanation`)}</p>
          <Button
            label={t(`subscription.${subscription.paymentGateway}.goto_provider`)}
            disabled={isLoading}
            busy={isLoading}
            onClick={redirectToBillingPortal}
          />
          {isLoading && <LoadingOverlay transparentBackground />}
        </>
      )}
    </div>
  );
};

type Props = {
  subscription: SubscriptionType | null;
};

const Subscription: React.FC<Props> = ({ subscription }) => {
  const { t } = useTranslation('user');

  const navigate = useNavigate();
  const location = useLocation();

  const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'active_trial';

  const onClick = () => {
    navigate(modalURLFromLocation(location, 'choose-offer'));
  };

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
          <Button onClick={onClick} label={t('user:payment.view_plans')} />
        </>
      )}
    </section>
  );
};

export default Subscription;
