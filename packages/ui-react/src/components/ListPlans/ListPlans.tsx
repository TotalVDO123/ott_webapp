import React, { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMatch } from 'react-router';
import { useQueryClient } from 'react-query';
import usePlansForMedia from '@jwp/ott-hooks-react/src/usePlansForMedia';
import LoadingOverlay from '@jwp/ott-ui-react/src/components/LoadingOverlay/LoadingOverlay';
import { PATH_MEDIA, PATH_USER_ACCOUNT } from '@jwp/ott-common/src/paths';

import PlanBox from '../PlanBox/PlanBox';
import Button from '../Button/Button';

import styles from './ListPlans.module.scss';

const ListPlans: React.FC = () => {
  const { t } = useTranslation('account');

  const queryClient = useQueryClient();
  const match = useMatch(PATH_MEDIA);

  const mediaId = match?.params.id || '';

  useLayoutEffect(() => {
    if (mediaId) {
      queryClient.invalidateQueries(['plans', mediaId]);
    }
  }, [mediaId, queryClient]);

  const { isLoading, data: plans } = usePlansForMedia(mediaId);

  if (isLoading) {
    return (
      <div style={{ height: 300 }}>
        <LoadingOverlay inline />
      </div>
    );
  }

  return (
    <div className={styles.listPlans}>
      <h1 className={styles.title}>{t('list_plans.title')}</h1>
      <p className={styles.description}>{t('list_plans.description')}</p>
      <div className={styles.plans}>
        {plans?.map(([plan, prices]) => (
          <PlanBox key={plan.id} plan={plan} prices={prices} />
        ))}
      </div>
      <Button variant="contained" color="primary" label={t('list_plans.go_to_account_settings')} to={PATH_USER_ACCOUNT} size="large" fullWidth />
    </div>
  );
};

export default ListPlans;
