import React from 'react';
import { useTranslation } from 'react-i18next';
import CheckmarkSVG from '@jwp/ott-theme/assets/icons/check-green.svg?react';
import useCountdown from '@jwp/ott-hooks-react/src/useCountdown';

import Button from '../Button/Button';

import styles from './Welcome.module.scss';

type Props = {
  onCloseButtonClick?: () => void;
  onCountdownCompleted?: () => void;
  siteName?: string;
};

const Welcome: React.FC<Props> = ({ onCloseButtonClick, onCountdownCompleted, siteName }) => {
  const { t } = useTranslation('account');
  const countdown = useCountdown(10, 1, onCountdownCompleted);

  return (
    <div className={styles.topContainer}>
      <div className={styles.circleHug}>
        <CheckmarkSVG />
      </div>
      <div className={styles.innerContainer}>
        <h2 className={styles.title}>{t('checkout.welcome_title')}</h2>
        <p className={styles.message}>{t('checkout.welcome_description', { siteName })}</p>
      </div>
      <div className={styles.buttonContainer}>
        <Button label={t('checkout.start_watching', { countdown })} onClick={onCloseButtonClick} color="primary" variant="contained" size="large" fullWidth />
      </div>
    </div>
  );
};

export default Welcome;
