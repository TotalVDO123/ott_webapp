import { AccessControlPlan } from '@jwp/ott-common/types/plans';

// Utility function to get Unix timestamp
export const getTimestamp = (daysOffset: number): number => {
  const now = new Date();
  now.setDate(now.getDate() + daysOffset);
  return Math.floor(now.getTime() / 1000);
};

// Precompute timestamps
const FUTURE_EXPIRY = getTimestamp(30); // 30 days from now
const PAST_EXPIRY = getTimestamp(-30); // 30 days ago

// API endpoints constant
export const ENDPOINTS = {
  GENERATE_TOKENS: '/v2/sites/:site_id/access/generate',
  REFRESH_TOKENS: '/v2/sites/:site_id/access/refresh',
};

// mock data for access tokens
export const ACCESS_TOKENS = {
  PASSPORT: {
    VALID: 'valid-passport',
    INVALID: 'invalid-passport',
  },
  REFRESH_TOKEN: {
    VALID: 'valid-refresh-token',
    INVALID: 'invalid-refresh-token',
  },
};

// plan variations mock
const createMockPlan = (id: string, exp: number): AccessControlPlan => ({
  id,
  exp,
  external_providers: { stripe: 'dummy123' },
});
export const PLANS = {
  VALID: [createMockPlan('plan1234', FUTURE_EXPIRY)],
  FREE: [createMockPlan('free1234', FUTURE_EXPIRY)],
  INVALID: [createMockPlan('plan123456', FUTURE_EXPIRY)],
  EXPIRED: [createMockPlan('plan123456', PAST_EXPIRY)],
};

// Valid and invalid site id mock
export const SITE_ID = {
  VALID: 'test1234',
  VALID_UPPER: 'A1B2C3D4',
  INVALID: 'invalid1234',
  SHORT: 'abc123',
  LONG: 'abcd12345',
  SPECIAL: 'abcd123!',
  EMPTY: '',
};

// Authorization mock - valid and invalid token
export const AUTHORIZATION = {
  VALID: 'Bearer valid-authorization',
  INVALID: 'Bearer invalid-authorization',
};
