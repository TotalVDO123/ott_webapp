import { testConfigs } from '@jwp/ott-testing/constants';

import constants, { longTimeout } from '#utils/constants';
import { LoginContext } from '#utils/password_utils';

Feature(`login - home`).retry(Number(process.env.TEST_RETRY_COUNT) || 0);

runTestSuite(testConfigs.jwpAuth, 'JW Player');
runTestSuite(testConfigs.cleengAuthvod, 'Cleeng');

function runTestSuite(config: typeof testConfigs.svod, providerName: string) {
  let loginContext: LoginContext;

  Scenario(`Sign-in buttons show for accounts config - ${providerName}`, async ({ I }) => {
    I.useConfig(config);
    await I.openSignInMenu();

    I.see('Sign in');
    I.see('Sign up');
  });

  Scenario(`Sign-in buttons don't show for config without accounts - ${providerName}`, async ({ I }) => {
    I.useConfig(config);
    await I.openSignInMenu();

    I.see('Sign in');
    I.see('Sign up');

    I.useConfig(testConfigs.basicNoAuth);

    await I.openSignInMenu();

    I.dontSee('Sign in');
    I.dontSee('Sign up');
  });

  Scenario(`I can open the log in modal - ${providerName}`, async ({ I }) => {
    I.useConfig(config);
    await I.openSignInModal();
    I.waitForElement(constants.loginFormSelector, longTimeout);

    await I.seeQueryParams({ u: 'login' });

    I.see('Sign in');
    I.see('Email');
    I.see('Password');
    I.see('Forgot password');
    I.see('New to JW OTT Web App (AuthVod)?');
    I.see('Sign up');
  });

  Scenario(`I can login - ${providerName}`, async ({ I }) => {
    I.useConfig(config);
    loginContext = await I.registerOrLogin(loginContext);

    await I.openMainMenu();

    I.dontSee('Sign in');
    I.dontSee('Sign up');

    I.see('Account');
    I.see('Favorites');
    I.see('Log out');
  });

  Scenario(`I can log out - ${providerName}`, async ({ I }) => {
    I.useConfig(config);
    loginContext = await I.registerOrLogin(loginContext);

    await I.openMainMenu();
    I.click('text=Log out');

    await I.openSignInMenu();

    I.see('Sign in');
    I.see('Sign up');
  });
}
