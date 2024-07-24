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
export const PLANS = {
  VALID: [{ id: 'plan1234', exp: 1921396650 }],
  FREE: [{ id: 'free1234', exp: 1921396650 }],
  INVALID: [{ id: 'plan123456', exp: 1921396650 }],
  EXPIRED: [{ id: 'plan123456', exp: 1721820321 }],
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
