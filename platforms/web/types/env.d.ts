/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />
interface ImportMetaEnv {
  readonly APP_DEFAULT_CONFIG_SOURCE: string | undefined;
  readonly APP_PLAYER_ID: string | undefined;
  readonly APP_PLAYER_LICENSE_KEY: string | undefined;
  readonly APP_DEFAULT_LANGUAGE: string | undefined;
  readonly APP_ENABLED_LANGUAGES: string | undefined;
  readonly APP_API_BASE_URL: string | undefined;
  readonly APP_VERSION: string | undefined;
  readonly APP_GOOGLE_SITE_VERIFICATION_ID: string | undefined;

  readonly APP_OAUTH_CLIENT_ID: string | undefined;
  readonly APP_OAUTH_CLIENT_SECRET: string | undefined;
  readonly APP_OAUTH_STORAGE: 'session' | 'local' | undefined;
  readonly APP_OAUTH_REDIRECT_URL: string | undefined;
  readonly APP_OAUTH_AUTO_LOGIN: 'true' | 'false' | undefined;
  readonly APP_OAUTH_AUTH_URL: string | undefined;
  readonly APP_OAUTH_TOKEN_URL: string | undefined;
  readonly APP_OAUTH_RESOURCE_URL: string | undefined;
  readonly APP_OAUTH_CONTENT_TOKEN_URL: string | undefined;

  readonly APP_OAUTH_SIGN_UP_URL: string | undefined;
  readonly APP_OAUTH_DASHBOARD_URL: string | undefined;
  readonly APP_OAUTH_UNLOCK_ONLY_PREMIUM: 'true' | 'false' | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
