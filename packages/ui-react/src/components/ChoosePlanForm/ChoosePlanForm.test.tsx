import React from 'react';
import { axe } from 'vitest-axe';
import { fireEvent, render } from '@testing-library/react';
import type { Offer } from '@jwp/ott-common/types/checkout';
import monthlyOffer from '@jwp/ott-testing/fixtures/monthlyOffer.json';
import yearlyOffer from '@jwp/ott-testing/fixtures/yearlyOffer.json';

import ChoosePlanForm from './ChoosePlanForm';

const svodOffers = [monthlyOffer, yearlyOffer] as unknown as Offer[];

describe('<PlansForm>', () => {
  test('renders and matches snapshot', () => {
    const { container } = render(
      <ChoosePlanForm
        values={{ selectedOfferId: 'S916977979_NL', selectedOfferType: 'svod' }}
        errors={{}}
        onChange={vi.fn()}
        setValue={vi.fn()}
        onSubmit={vi.fn()}
        submitting={false}
        offers={svodOffers}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('checks the monthly plan price correctly', () => {
    const { getByTestId } = render(
      <ChoosePlanForm
        values={{ selectedOfferId: 'S916977979_NL', selectedOfferType: 'svod' }}
        errors={{}}
        onChange={vi.fn()}
        setValue={vi.fn()}
        onSubmit={vi.fn()}
        submitting={false}
        offers={svodOffers}
      />,
    );

    expect(getByTestId('S916977979_NL')).toBeChecked();
  });

  test('checks the yearly plan price correctly', () => {
    const { getByTestId } = render(
      <ChoosePlanForm
        values={{ selectedOfferId: 'S345569153_NL', selectedOfferType: 'svod' }}
        errors={{}}
        onChange={vi.fn()}
        setValue={vi.fn()}
        onSubmit={vi.fn()}
        submitting={false}
        offers={svodOffers}
      />,
    );

    fireEvent.click(getByTestId('offer-period-year'));

    expect(getByTestId('S345569153_NL')).toBeChecked();
  });

  test('calls the onChange callback when changing the offer', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <ChoosePlanForm
        values={{ selectedOfferId: 'S916977979_NL', selectedOfferType: 'svod' }}
        errors={{}}
        onChange={onChange}
        setValue={vi.fn()}
        onSubmit={vi.fn()}
        submitting={false}
        offers={svodOffers}
      />,
    );

    fireEvent.click(getByTestId('offer-period-year'));

    fireEvent.click(getByTestId('S345569153_NL'));

    expect(onChange).toHaveBeenCalled();
  });

  test('calls the onSubmit callback when submitting the form', () => {
    const onSubmit = vi.fn();
    const { getByTestId } = render(
      <ChoosePlanForm
        values={{ selectedOfferId: 'S916977979_NL', selectedOfferType: 'svod' }}
        errors={{}}
        onChange={vi.fn()}
        setValue={vi.fn()}
        onSubmit={onSubmit}
        submitting={false}
        offers={svodOffers}
      />,
    );

    fireEvent.submit(getByTestId('choose-offer-form'));

    expect(onSubmit).toBeCalled();
  });

  test('WCAG 2.2 (AA) compliant', async () => {
    const { container } = render(
      <ChoosePlanForm
        values={{ selectedOfferId: 'S916977979_NL', selectedOfferType: 'svod' }}
        errors={{}}
        onChange={vi.fn()}
        setValue={vi.fn()}
        onSubmit={vi.fn()}
        submitting={false}
        offers={svodOffers}
      />,
    );

    expect(await axe(container, { runOnly: ['wcag21a', 'wcag21aa', 'wcag22aa'] })).toHaveNoViolations();
  });
});
