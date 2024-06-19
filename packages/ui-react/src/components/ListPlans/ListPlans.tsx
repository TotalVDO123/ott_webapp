import React, { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { useQueryClient } from 'react-query';
import usePlansForMedia from '@jwp/ott-hooks-react/src/usePlansForMedia';
import LoadingOverlay from '@jwp/ott-ui-react/src/components/LoadingOverlay/LoadingOverlay';
import { PATH_USER_ACCOUNT } from '@jwp/ott-common/src/paths';

import PlanBox from '../PlanBox/PlanBox';
import Button from '../Button/Button';
import useQueryParam from '../../hooks/useQueryParam';
import { modalURLFromLocation } from '../../utils/location';

import styles from './ListPlans.module.scss';

const ListPlans: React.FC = () => {
  const { t } = useTranslation('account');

  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  const mediaId = useQueryParam('mediaId');

  useLayoutEffect(() => {
    if (mediaId) {
      queryClient.invalidateQueries(['plans', mediaId]);
    }
  }, [mediaId, queryClient]);

  const { isLoading, data: plans } = usePlansForMedia(mediaId || '');

  useLayoutEffect(() => {
    navigate(modalURLFromLocation(location, 'list-plans', { mediaId: undefined }), { replace: true });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId]);

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
