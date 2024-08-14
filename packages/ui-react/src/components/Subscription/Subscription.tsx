import React from 'react';
import { useTranslation } from 'react-i18next';

import Button from '../Button/Button';

type Props = {
  onSubmit?: () => void;
  error: string | null;
};

const Subscription: React.FC<Props> = () => {
  const { t } = useTranslation('user');
  return (
    <section>
      <div>
        <p>{t('payment.stripe_subscription_text')}</p>
        <Button label="Go to Stripe" />
      </div>
    </section>
  );
};

export default Subscription;
