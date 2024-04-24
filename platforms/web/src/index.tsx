import React from 'react';
import { createRoot } from 'react-dom/client';
import 'wicg-inert';
import { registerSW } from 'virtual:pwa-register';
import { configureEnv } from '@jwp/ott-common/src/env';

import './modules/register';

import App from './App';

import { attachAccessibilityListener } from '#src/utils/accessibility';

// Collect env vars
configureEnv({
  APP_VERSION: import.meta.env.APP_VERSION,

  APP_API_BASE_URL: import.meta.env.APP_API_BASE_URL,
  APP_PLAYER_ID: import.meta.env.APP_PLAYER_ID,

  APP_DEFAULT_CONFIG_SOURCE: import.meta.env.APP_DEFAULT_CONFIG_SOURCE,
  APP_PLAYER_LICENSE_KEY: import.meta.env.APP_PLAYER_LICENSE_KEY,

  APP_FOOTER_TEXT: import.meta.env.APP_FOOTER_TEXT,
  APP_BODY_FONT: import.meta.env.APP_BODY_FONT,
  APP_BODY_ALT_FONT: import.meta.env.APP_BODY_ALT_FONT,

  // Following are the OAuth related
  APP_OAUTH_CLIENT_ID: import.meta.env.APP_OAUTH_CLIENT_ID,
  APP_OAUTH_CLIENT_SECRET: import.meta.env.APP_OAUTH_CLIENT_SECRET,
  APP_OAUTH_STORAGE: ['local', 'session'].includes(import.meta.env.APP_OAUTH_STORAGE as string)
    ? (import.meta.env.APP_OAUTH_STORAGE as 'local' | 'session')
    : 'session',
  APP_OAUTH_REDIRECT_URL: import.meta.env.APP_OAUTH_REDIRECT_URL,
  APP_OAUTH_AUTO_LOGIN: ['true', 'false'].includes(import.meta.env.APP_OAUTH_AUTO_LOGIN as string) ? import.meta.env.APP_OAUTH_AUTO_LOGIN === 'true' : false,
  APP_OAUTH_AUTH_URL: import.meta.env.APP_OAUTH_AUTH_URL,
  APP_OAUTH_TOKEN_URL: import.meta.env.APP_OAUTH_TOKEN_URL,
  APP_OAUTH_RESOURCE_URL: import.meta.env.APP_OAUTH_RESOURCE_URL,
  APP_OAUTH_CONTENT_TOKEN_URL: import.meta.env.APP_OAUTH_CONTENT_TOKEN_URL,
  APP_OAUTH_SIGN_UP_URL: import.meta.env.APP_OAUTH_SIGN_UP_URL,
  APP_OAUTH_DASHBOARD_URL: import.meta.env.APP_OAUTH_DASHBOARD_URL,
  APP_OAUTH_UNLOCK_ONLY_PREMIUM: ['true', 'false'].includes(import.meta.env.APP_OAUTH_UNLOCK_ONLY_PREMIUM as string)
    ? import.meta.env.APP_OAUTH_UNLOCK_ONLY_PREMIUM === 'true'
    : false,
});

attachAccessibilityListener();

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
} else {
  console.info('Application - rootElement not found');
}

const refresh = registerSW({
  immediate: true,
  onNeedRefresh: () => refresh(true),
});
