import React from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import type { FormErrors } from '@jwp/ott-common/types/form';
import type { Offer, ChooseOfferFormData } from '@jwp/ott-common/types/checkout';
import { useConfigStore } from '@jwp/ott-common/src/stores/ConfigStore';
import { testId } from '@jwp/ott-common/src/utils/common';

import Button from '../Button/Button';
import FormFeedback from '../FormFeedback/FormFeedback';
import DialogBackButton from '../DialogBackButton/DialogBackButton';
import LoadingOverlay from '../LoadingOverlay/LoadingOverlay';
import PriceBox from '../PriceBox/PriceBox';

import styles from './ChooseOfferForm.module.scss';

type Props = {
  values: ChooseOfferFormData;
  errors: FormErrors<ChooseOfferFormData>;
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onBackButtonClickHandler?: () => void;
  offers: Offer[];
  showOfferTypeSwitch: boolean;
  submitting: boolean;
};

const ChooseOfferForm: React.FC<Props> = ({ values, errors, submitting, offers, showOfferTypeSwitch, onChange, onSubmit, onBackButtonClickHandler }: Props) => {
  const siteName = useConfigStore((s) => s.config.siteName);
  const { t } = useTranslation('account');
  const { selectedOfferType, selectedOfferId } = values;

  return (
    <form onSubmit={onSubmit} data-testid={testId('choose-offer-form')} noValidate>
      {onBackButtonClickHandler ? <DialogBackButton onClick={onBackButtonClickHandler} /> : null}
      <h1 className={styles.title}>{t('choose_offer.title')}</h1>
      <p className={styles.subtitle}>{t('choose_offer.watch_this_on_platform', { siteName })}</p>
      {errors.form ? <FormFeedback variant="error">{errors.form}</FormFeedback> : null}
      {showOfferTypeSwitch && (
        <div className={styles.offerGroupSwitch}>
          <input
            className={styles.radio}
            onChange={onChange}
            type="radio"
            name="selectedOfferType"
            id="svod"
            value="svod"
            checked={selectedOfferType === 'svod'}
          />
          <label className={classNames(styles.label, styles.offerGroupLabel)} htmlFor="svod">
            {t('choose_offer.subscription')}
          </label>
          <input
            className={styles.radio}
            onChange={onChange}
            type="radio"
            name="selectedOfferType"
            id="tvod"
            value="tvod"
            checked={selectedOfferType === 'tvod'}
          />
          <label className={classNames(styles.label, styles.offerGroupLabel)} htmlFor="tvod">
            {t('choose_offer.one_time_only')}
          </label>
        </div>
      )}
      <div className={styles.offers}>
        {!offers.length ? (
          <p>{t('choose_offer.no_pricing_available')}</p>
        ) : (
          offers.map((offer) => <PriceBox key={offer.offerId} offer={offer} selected={selectedOfferId === offer.offerId} onChange={onChange} />)
        )}
      </div>
      {submitting && <LoadingOverlay transparentBackground inline />}
      <Button label={t('choose_offer.continue')} disabled={submitting || !offers.length} variant="contained" color="primary" type="submit" fullWidth />
    </form>
  );
};
export default ChooseOfferForm;
