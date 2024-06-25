import React, { useState, useMemo, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { FormErrors } from '@jwp/ott-common/types/form';
import type { Offer, ChooseOfferFormData } from '@jwp/ott-common/types/checkout';
import { testId } from '@jwp/ott-common/src/utils/common';

import Button from '../Button/Button';
import ButtonGroup from '../Button/ButtonGroup';
import FormFeedback from '../FormFeedback/FormFeedback';
import DialogBackButton from '../DialogBackButton/DialogBackButton';
import LoadingOverlay from '../LoadingOverlay/LoadingOverlay';
import PriceBox from '../PriceBox/PriceBox';

import styles from './ChoosePlanForm.module.scss';

type OfferPeriod = 'month' | 'year';

type Props = {
  values: ChooseOfferFormData;
  errors: FormErrors<ChooseOfferFormData>;
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  setValue: (key: keyof ChooseOfferFormData, value: string) => void;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onBackButtonClickHandler?: () => void;
  offers: Offer[];
  submitting: boolean;
};

const ChoosePlanForm: React.FC<Props> = ({ values, errors, submitting, offers, onChange, setValue, onSubmit, onBackButtonClickHandler }: Props) => {
  const { t } = useTranslation('account');
  const { selectedOfferId } = values;

  const groupedOffers = useMemo(
    () => offers.reduce((acc, offer) => ({ ...acc, [offer.period]: [...(acc[offer.period as OfferPeriod] || []), offer] }), {} as Record<OfferPeriod, Offer[]>),
    [offers],
  );

  const [offerFilter, setOfferFilter] = useState<OfferPeriod>(() => Object.keys(groupedOffers)[0] as OfferPeriod);

  useLayoutEffect(() => {
    setValue('selectedOfferId', groupedOffers[offerFilter as OfferPeriod]?.[0].offerId || '');

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerFilter]);

  return (
    <form onSubmit={onSubmit} data-testid={testId('choose-offer-form')} noValidate>
      {onBackButtonClickHandler ? <DialogBackButton onClick={onBackButtonClickHandler} /> : null}
      <h1 className={styles.title}>{t('choose_offer.title')}</h1>
      {errors.form ? <FormFeedback variant="error">{errors.form}</FormFeedback> : null}
      <div className={styles.tabs}>
        <ButtonGroup>
          {Object.keys(groupedOffers).map((period) => (
            <Button
              key={period}
              label={t(`periods.${period}`)}
              onClick={() => {
                setOfferFilter(period as OfferPeriod);
              }}
              active={offerFilter === period}
              className={styles.groupedButton}
              data-testid={testId(`offer-period-${period}`)}
            />
          ))}
        </ButtonGroup>
      </div>
      <div className={styles.offers}>
        {!offers.length ? (
          <p>{t('choose_offer.no_pricing_available')}</p>
        ) : (
          groupedOffers[offerFilter].map((offer) => (
            <PriceBox key={offer.offerId} offer={offer} selected={selectedOfferId === offer.offerId} onChange={onChange} />
          ))
        )}
      </div>
      {submitting && <LoadingOverlay transparentBackground inline />}
      <Button
        label={t('choose_offer.continue')}
        disabled={!selectedOfferId || submitting || !offers.length}
        variant="contained"
        color="primary"
        type="submit"
        fullWidth
      />
    </form>
  );
};
export default ChoosePlanForm;
