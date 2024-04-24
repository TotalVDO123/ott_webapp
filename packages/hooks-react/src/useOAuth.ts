import { useContext } from 'react';
import { AuthContext, AuthProvider, type IAuthContext, type TAuthConfig, type TRefreshTokenExpiredEvent } from 'react-oauth2-code-pkce';
import type { Customer } from '@jwp/ott-common/types/account';
import type { Env } from '@jwp/ott-common/src/env';

let oAuthResourceUrl: string;
let oAuthContentTokenUrl: string;

const getOAuthConfig = (env: Env): TAuthConfig => {
  oAuthResourceUrl = env.APP_OAUTH_RESOURCE_URL as string;
  oAuthContentTokenUrl = env.APP_OAUTH_CONTENT_TOKEN_URL as string;
  return {
    state: 'oauth-login',
    scope: 'openid email profile',
    clearURL: true,
    decodeToken: false,
    storage: env.APP_OAUTH_STORAGE,
    clientId: env.APP_OAUTH_CLIENT_ID as string,
    autoLogin: env.APP_OAUTH_AUTO_LOGIN || false,
    authorizationEndpoint: env.APP_OAUTH_AUTH_URL as string,
    tokenEndpoint: env.APP_OAUTH_TOKEN_URL as string,
    extraTokenParameters: {
      client_secret: env.APP_OAUTH_CLIENT_SECRET as string,
    },
    redirectUri: (env.APP_OAUTH_REDIRECT_URL || undefined) as string,
    // eslint-disable-next-line no-alert
    onRefreshTokenExpire: (event: TRefreshTokenExpiredEvent) => window.confirm('Session expired. Refresh page to continue using the site?') && event.login(),
  };
};

/**
 *  User access token resource *
 * @param {string} authorization
 */
const getOAuthUserResource = async (authorization?: string): Promise<null | Customer> => {
  if (!oAuthResourceUrl || !authorization) return Promise.resolve(null);
  return fetch(oAuthResourceUrl, {
    headers: {
      authorization,
    },
  })
    .then(async (response) => {
      if (response.ok) {
        const parsedResponse = await response.json();
        if (!parsedResponse?.ID) return null;
        return {
          id: parsedResponse?.ID,
          fullName: parsedResponse?.display_name,
          firstName: parsedResponse?.display_name,
          lastName: parsedResponse?.display_name,
          email: parsedResponse?.user_email as string,
          isPremium: parsedResponse?.is_premium,
          country: 'UK',
          metadata: {},
        };
      }
      return null;
    })
    .catch(() => null);
};

/**
 *  Generate jwt token based on the path
 *  set secret key in the backend env as APP_API_V1_CREDENTIAL to generate the token (from api credentials v1)
 *  set APP_OAUTH_CONTENT_TOKEN_URL as your backend url to generate the token
 *  ref: https://docs.jwplayer.com/platform/reference/protect-your-content-with-signed-urls
 *
 * @param {string} resourceId
 * @param {string} authorization
 */
const generateJwtSignedContentToken = async (resourceId: string, authorization: string) => {
  if (!authorization || !oAuthContentTokenUrl) return;
  return fetch(`${oAuthContentTokenUrl}?resourceId=${resourceId}`, {
    method: 'get',
    headers: {
      authorization,
    },
  })
    .then((response) => {
      if (response.ok) return response.json();
      return null;
    })
    .catch(() => null);
};

const useOAuth = () => useContext<IAuthContext>(AuthContext);

export { AuthProvider, getOAuthConfig, useOAuth, getOAuthUserResource, generateJwtSignedContentToken };
