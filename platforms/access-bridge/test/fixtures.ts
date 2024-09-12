import Stripe from 'stripe';
import { Plan } from '@jwp/ott-common/types/plans.js';
import { Price, Product } from '@jwp/ott-common/types/payment.js';

import { Viewer } from '../src/services/identity-service';
import { ErrorDefinitions } from '../src/errors.js';

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
  GENERATE_PASSPORT: '/v2/sites/:site_id/access/generate',
  REFRESH_PASSPORT: '/v2/sites/:site_id/access/refresh',
  PRODUCTS: '/v2/sites/:site_id/products',
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

export const VALID_PLAN_ID = 'plan1234';
export const VIEWER: Viewer = {
  id: '123456',
  email: 'dummy@test.com',
};

// Plan mock creation function
const createMockPlan = ({ name, access_model, access_plan, access, metadata }: Plan): Plan => ({
  name,
  access_model,
  access_plan,
  access,
  metadata,
});

export const PLANS = {
  VALID: [
    createMockPlan({
      name: 'plan1234',
      access_model: 'svod',
      access_plan: {
        id: 'plan1234',
        exp: FUTURE_EXPIRY,
      },
      access: {
        drm_policy_id: 'drm_policy_123',
        tags: {
          include: ['tag1'],
          exclude: ['tag2'],
        },
      },
      metadata: {
        external_providers: {
          stripe: 'stripe_id',
        },
      },
    }),
  ],
  FREE: [
    createMockPlan({
      name: 'free1234',
      access_model: 'free',
      access_plan: {
        id: 'free1234',
        exp: FUTURE_EXPIRY,
      },
      access: {
        drm_policy_id: 'drm_policy_456',
        tags: {
          include: ['tag3'],
          exclude: [],
        },
      },
      metadata: {
        external_providers: {},
      },
    }),
  ],
  INVALID: [
    createMockPlan({
      name: 'plan123456',
      access_model: 'svod',
      access_plan: {
        id: 'plan123456',
        exp: FUTURE_EXPIRY,
      },
      access: {
        drm_policy_id: 'drm_policy_789',
        tags: {
          include: ['tag4'],
          exclude: ['tag5'],
        },
      },
      metadata: {
        external_providers: {},
      },
    }),
  ],
  EXPIRED: [
    createMockPlan({
      name: 'plan1234',
      access_model: 'svod',
      access_plan: {
        id: 'plan1234',
        exp: PAST_EXPIRY,
      },
      access: {
        drm_policy_id: 'drm_policy_101',
        tags: {
          include: ['tag6'],
          exclude: [],
        },
      },
      metadata: {
        external_providers: {},
      },
    }),
  ],
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

// Stripe price mock
export const STRIPE_PRICE: Price = {
  id: 'price_123456789',
  currency: 'usd',
  product: 'prod_123456789',
  recurring: {
    interval: 'month',
    trial_period_days: 1,
  },
  unit_amount: 1000,
};

// Stripe product mock
export const STRIPE_PRODUCT: Product = {
  id: 'prod_123456789',
  name: 'Sample Product',
  description: 'A high-quality product description',
  default_price: 'price_123456789',
  prices: [STRIPE_PRICE],
};

// mock of the handled error cases for Stripe
export const STRIPE_ERRORS = [
  {
    error: new Stripe.errors.StripeInvalidRequestError({
      type: 'invalid_request_error',
      message: 'Invalid request',
    }),
    expectedCode: ErrorDefinitions.BadRequestError.code,
    statusCode: 400,
  },

  {
    error: new Stripe.errors.StripeAuthenticationError({
      type: 'authentication_error',
      message: 'Not authenticated.',
    }),
    expectedCode: ErrorDefinitions.UnauthorizedError.code,
    statusCode: 401,
  },

  {
    error: new Stripe.errors.StripePermissionError({
      type: 'invalid_grant',
      message: 'Permission error request.',
    }),
    expectedCode: ErrorDefinitions.ForbiddenError.code,
    statusCode: 403,
  },

  {
    error: new Stripe.errors.StripeAPIError({
      type: 'api_error',
      message: 'Invalid request',
    }),
    expectedCode: ErrorDefinitions.BadRequestError.code,
    statusCode: 400,
  },
];
