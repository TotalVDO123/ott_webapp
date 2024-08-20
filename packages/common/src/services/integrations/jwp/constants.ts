const MIDDLEWARE_BASE_URL = 'http://localhost:3000/v2';
const MIDDLEWARE_SITE_BASE_URL = (siteId: string) => `${MIDDLEWARE_BASE_URL}/sites/${siteId}`;

export const API_CONSTS = {
  DAILY: {
    API_BASE_URL: 'https://daily-sims.jwplayer.com',
    MIDDLEWARE_BASE_URL,
    MIDDLEWARE_SITE_BASE_URL,
  },
  STAGING: {
    API_BASE_URL: 'https://staging-sims.jwplayer.com',
    MIDDLEWARE_BASE_URL,
    MIDDLEWARE_SITE_BASE_URL,
  },
  PROD: {
    API_BASE_URL: 'https://sims.jwplayer.com',
    MIDDLEWARE_BASE_URL,
    MIDDLEWARE_SITE_BASE_URL,
  },
};
