import type { FC, SVGProps } from 'react';
import { useTranslation } from 'react-i18next';
import type { Offer } from '@jwp/ott-common/types/checkout';
import { getOfferPrice } from '@jwp/ott-common/src/utils/offers';
import CheckCircle from '@jwp/ott-theme/assets/icons/check_circle.svg?react';
import type { PlanDetailsResponse } from '@jwp/ott-common/types/jw';

import Icon from '../Icon/Icon';

import styles from './PlanBox.module.scss';

type ListItemProps = {
  text: string;
  icon: FC<SVGProps<SVGSVGElement>>;
};

const ListItem: FC<ListItemProps> = ({ text, icon }) => (
  <li>
    <Icon icon={icon} />
    {text}
    <span className="hidden">.</span>
  </li>
);

type Props = {
  plan: PlanDetailsResponse;
  prices: Offer[];
};

const PlanBox: FC<Props> = ({ plan, prices }) => {
  const { t } = useTranslation('account');

  return (
    <div className={styles.plan} aria-labelledby={`title-${plan.id}`}>
      <div className={styles.box} />
      <div className={styles.label}>
        <label htmlFor={plan.id}>
          <h2 className={styles.planTitle} id={`title-${plan.id}`}>
            {plan.metadata.name}
          </h2>
          <span className="hidden">.</span>
          <hr className={styles.titleDivider} aria-hidden={true} />
          <ul className={styles.planBenefits}>
            <ListItem text={t('choose_offer.benefits.cancel_anytime')} icon={CheckCircle} />
            <ListItem text={t('choose_offer.benefits.watch_on_all_devices')} icon={CheckCircle} />
          </ul>
          <div className={styles.fill} />
          <div className={styles.planPrices}>
            {prices.map((price, i, array) => (
              <>
                <div className={styles.planPrice}>
                  {getOfferPrice(price)} <small>/{price.period === 'month' ? t('periods.month') : t('periods.year')}</small>
                </div>
                {i < array.length - 1 && (
                  <div className={styles.divider} aria-hidden={true}>
                    {t('list_plans.or')}
                  </div>
                )}
              </>
            ))}
          </div>
        </label>
      </div>
    </div>
  );
};

export default PlanBox;
