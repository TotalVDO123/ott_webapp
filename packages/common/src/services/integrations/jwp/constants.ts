const MIDDLEWARE_BASE_URL = 'http://localhost:3000';

export const API_CONSTS = {
  DAILY: {
    API_BASE_URL: 'https://daily-sims.jwplayer.com',
    ACCESS_BRIDGE_URL: 'https://access-bridge-57322003213.europe-west1.run.app',
  },
  STAGING: {
    API_BASE_URL: 'https://staging-sims.jwplayer.com',
    MIDDLEWARE_BASE_URL,
    ACCESS_BRIDGE_URL: 'https://access-bridge-57322003213.europe-west1.run.app',
  },
  PROD: {
    API_BASE_URL: 'https://sims.jwplayer.com',
    MIDDLEWARE_BASE_URL,
    ACCESS_BRIDGE_URL: 'https://access-bridge-prod-url.coming',
  },
};
