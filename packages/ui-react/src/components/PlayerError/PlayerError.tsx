import React from 'react';
import { useTranslation } from 'react-i18next';

import styles from './PlayerError.module.scss';

export enum PlayerErrorState {
  GEO_BLOCKED = 'GEO_BLOCKED',
  USER_BLOCKED = 'USER_BLOCKED',
}

type Props = {
  error: keyof typeof PlayerErrorState;
};

const PlayerError: React.FC<Props> = ({ error }) => {
  const { t } = useTranslation('video');
  return (
    <div className={styles.error}>
      {error === PlayerErrorState.GEO_BLOCKED ? (
        <>
          <h2 className={styles.title}>{t('player_error.geo_blocked_title')}</h2>
          <p>{t('player_error.geo_blocked_description')}</p>
        </>
      ) : null}
      {error === PlayerErrorState.USER_BLOCKED ? (
        <>
          <h2 className={styles.title}>{t('player_error.user_blocked_title')}</h2>
          <p>{t('player_error.user_blocked_description')}</p>
        </>
      ) : null}
    </div>
  );
};

export default PlayerError;
