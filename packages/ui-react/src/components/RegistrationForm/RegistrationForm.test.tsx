import React from 'react';

import { renderWithRouter, waitForWithFakeTimers } from '../../../test/utils';

import RegistrationForm from './RegistrationForm';

// The SocialButton component contains an SVG import that results in an absolute path on the current machine
// This results in snapshot inconsistencies per machine
vi.mock('../SocialButton/SocialButton.tsx', () => ({
  default: (props: { href: string }) => {
    return <a href={props.href}>Social Button</a>;
  },
}));

const socialLoginURLs = {
  twitter: 'https://staging-v2.inplayer.com/',
  facebook: 'https://www.facebook.com/',
  google: 'https://accounts.google.com/',
};

describe('<RegistrationForm>', () => {
  test('renders and matches snapshot', async () => {
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

    await waitForWithFakeTimers();

    expect(container).toMatchSnapshot();
  });
});
