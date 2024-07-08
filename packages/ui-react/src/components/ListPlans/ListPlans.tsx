import React from 'react';
import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { PATH_USER_PAYMENTS } from '@jwp/ott-common/src/paths';
import type { Offer } from '@jwp/ott-common/types/checkout';

import PlanBox from '../PlanBox/PlanBox';
import Button from '../Button/Button';

import styles from './ListPlans.module.scss';

type Props = {
  plans: (readonly [{ id: string; name: string }, Offer[]])[];
};

const ListPlans: React.FC<Props> = ({ plans }) => {
  const location = useLocation();

  const { t } = useTranslation('account');

  return (
    <div className={styles.listPlans}>
      <h1 className={styles.title}>{t('list_plans.title')}</h1>
      <p className={styles.description}>{t('list_plans.description')}</p>
      <div className={styles.plans}>
        {plans?.map(([{ id, name }, prices]) => (
          <PlanBox key={id} id={id} name={name} prices={prices} />
        ))}
      </div>
      <Button
        variant="contained"
        color="primary"
        label={t('list_plans.go_to_account_settings')}
        to={PATH_USER_PAYMENTS}
        navLinkState={{ returnToPathname: location.pathname }}
        size="large"
        fullWidth
      />
    </div>
  );
};

export default ListPlans;
