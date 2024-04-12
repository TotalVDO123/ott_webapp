import React from 'react';

import { renderWithRouter } from '../../../test/utils';

import RegistrationForm from './RegistrationForm';

const socialLoginURLs = {
  twitter: 'https://staging-v2.inplayer.com/',
  facebook: 'https://www.facebook.com/',
  google: 'https://accounts.google.com/',
};

describe('<RegistrationForm>', () => {
  test('renders and matches snapshot', () => {
    const { container } = renderWithRouter(
      <RegistrationForm
        publisherConsents={null}
        onSubmit={vi.fn()}
        onChange={vi.fn()}
        onBlur={vi.fn()}
        values={{ email: '', password: '' }}
        errors={{}}
        submitting={false}
        consentErrors={[]}
        consentValues={{}}
        loading={false}
        onConsentChange={vi.fn()}
        socialLoginURLs={socialLoginURLs}
      />,
    );

    expect(container).toMatchSnapshot();
  });
});
