import React, { type FC, type SVGProps } from 'react';
import { useTranslation } from 'react-i18next';
import type { Offer } from '@jwp/ott-common/types/checkout';
import { getOfferPrice, isSVODOffer } from '@jwp/ott-common/src/utils/offers';
import { testId } from '@jwp/ott-common/src/utils/common';
import CheckCircle from '@jwp/ott-theme/assets/icons/check_circle.svg?react';

import Icon from '../Icon/Icon';

import styles from './PriceBox.module.scss';

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

type OptionProps = {
  title: string;
  periodString?: string;
  secondBenefit?: string;
  offer: Offer;
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  selected: boolean;
};

const Option: FC<OptionProps> = ({ title, periodString, secondBenefit, offer, onChange, selected }) => {
  const { t } = useTranslation('account');

  const getFreeTrialText = (offer: Offer) => {
    if (offer.freeDays) {
      return t('choose_offer.benefits.first_days_free', { count: offer.freeDays });
    } else if (offer.freePeriods) {
      // t('periods.day', { count })
      // t('periods.week', { count })
      // t('periods.month', { count })
      // t('periods.year', { count })
      const period = t(`periods.${offer.period}`, { count: offer.freePeriods });

      return t('choose_offer.benefits.first_periods_free', { count: offer.freePeriods, period });
    }

    return null;
  };

  return (
    <div className={styles.offer} aria-labelledby={`title-${offer.offerId}`}>
      <input
        className={styles.radio}
        onChange={onChange}
        type="radio"
        name={'selectedOfferId'}
        value={offer.offerId}
        id={offer.offerId}
        checked={selected}
        data-testid={testId(offer.offerId)}
      />
      <div className={styles.label}>
        <label htmlFor={offer.offerId}>
          <h2 className={styles.offerTitle} id={`title-${offer.offerId}`}>
            {title}
          </h2>
          <span className="hidden">.</span>
          <hr className={styles.offerDivider} aria-hidden={true} />
          <ul className={styles.offerBenefits}>
            {offer.freeDays || offer.freePeriods ? <ListItem text={getFreeTrialText(offer) || ''} icon={CheckCircle} /> : null}
            {!!secondBenefit && <ListItem text={secondBenefit} icon={CheckCircle} />}
            {<ListItem text={t('choose_offer.benefits.watch_on_all_devices')} icon={CheckCircle} />}
          </ul>
          <div className={styles.fill} />
          <div className={styles.offerPrice}>
            {getOfferPrice(offer)} {!!periodString && <small>/{periodString}</small>}
          </div>
        </label>
      </div>
    </div>
  );
};

type Props = {
  offer: Offer;
  selected: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
};

const PriceBox: React.FC<Props> = ({ offer, selected, onChange }) => {
  const { t } = useTranslation('account');

  if (isSVODOffer(offer)) {
    const isMonthly = offer.period === 'month';

    return (
      <Option
        title={offer.offerTitle}
        secondBenefit={t('choose_offer.benefits.cancel_anytime')}
        periodString={isMonthly ? t('periods.month') : t('periods.year')}
        offer={offer}
        onChange={onChange}
        selected={selected}
      />
    );
  }

  return (
    <Option
      title={offer.offerTitle}
      secondBenefit={
        !!offer.durationPeriod && !!offer.durationAmount
          ? t('choose_offer.tvod_access', { period: offer.durationPeriod, count: offer.durationAmount })
          : undefined
      }
      offer={offer}
      onChange={onChange}
      selected={selected}
    />
  );
};

export default PriceBox;
