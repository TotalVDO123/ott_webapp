import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import OAuthBackToAccountButton from './OAuthBackToAccountButton';

describe('<OAuthBackToAccountButton>', () => {
  it('redirects to the given targetUrl when clicked', () => {
    const targetUrl = 'https://example.com';
    const replaceMock = vi.fn();

    Object.defineProperty(window, 'location', {
      value: {
        replace: replaceMock,
      },
      writable: true,
    });

    const { getByText } = render(<OAuthBackToAccountButton targetUrl={targetUrl} />);
    fireEvent.click(getByText('Back to account'));

    expect(window.location.replace).toHaveBeenCalledWith(targetUrl);
  });
});
