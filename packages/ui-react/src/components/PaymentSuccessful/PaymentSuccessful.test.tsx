import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';

import PaymentSuccessful from './PaymentSuccessful';

describe('<PaymentSuccessful>', () => {
  test('renders and matches snapshot', () => {
    const { container } = render(<PaymentSuccessful siteName="Sitename!" />);

    expect(container).toMatchSnapshot();
  });

  test('calls the onCloseButtonClick callback when clicking the close button', () => {
    const onCloseButtonClick = vi.fn();
    const { getByText } = render(<PaymentSuccessful onCloseButtonClick={onCloseButtonClick} siteName="Sitename!" />);

    fireEvent.click(getByText('checkout.start_watching'));

    expect(onCloseButtonClick).toBeCalled();
  });

  test('calls the onCloseButtonClick callback when timer expires', () => {
    vi.useFakeTimers();
    const onCountdownCompleted = vi.fn();

    render(<PaymentSuccessful onCountdownCompleted={onCountdownCompleted} siteName="Sitename!" />);

    let i = 10;
    while (i--) {
      act(() => {
        vi.runAllTimers();
      });
    }

    expect(onCountdownCompleted).toBeCalled();
    vi.useRealTimers();
  });
});
