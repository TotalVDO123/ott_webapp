import Stripe from 'stripe';
import { AccessControlPlan } from '@jwp/ott-common/types/plans.js';

import { StripeProduct } from '../src/services/stripe-service.js';
import { ErrorCode } from '../src/errors.js';

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
  PRODUCTS: '/v2/sites/:site_id/products',
  CHECKOUT: '/v2/sites/:site_id/checkout',
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
  MISSING: '',
};

// Stripe price mock
export const STRIPE_PRICE: Stripe.Price = {
  id: 'price_123456789',
  object: 'price',
  active: true,
  billing_scheme: 'per_unit',
  created: PAST_EXPIRY,
  currency: 'usd',
  custom_unit_amount: null,
  livemode: false,
  lookup_key: 'mock_lookup_key',
  metadata: {},
  nickname: 'Standard Price',
  product: 'prod_123456789',
  recurring: {
    interval: 'month',
    interval_count: 1,
    usage_type: 'licensed',
    aggregate_usage: null,
    trial_period_days: 1,
  },
  tax_behavior: 'exclusive',
  tiers_mode: 'graduated',
  transform_quantity: {
    divide_by: 1,
    round: 'up',
  },
  type: 'recurring',
  unit_amount: 1000,
  unit_amount_decimal: '10.00',
};

// Stripe product mock
export const STRIPE_PRODUCT: StripeProduct = {
  id: 'prod_123456789',
  object: 'product',
  active: true,
  created: PAST_EXPIRY,
  updated: PAST_EXPIRY,
  description: 'A high-quality product description',
  images: ['https://example.com/image1.png'],
  livemode: false,
  marketing_features: [{ name: 'Test' }, { name: 'Mock' }],
  metadata: {},
  name: 'Sample Product',
  package_dimensions: null,
  shippable: true,
  tax_code: 'txcd_123456',
  type: 'good',
  url: 'https://example.com/product_page',
  prices: [STRIPE_PRICE],
};

// mock of the handled error cases for Stripe
export const STRIPE_ERRORS = [
  {
    error: new Stripe.errors.StripeInvalidRequestError({
      type: 'invalid_request_error',
      message: 'Invalid request',
    }),
    expectedCode: ErrorCode.BadRequestError,
    statusCode: 400,
  },

  {
    error: new Stripe.errors.StripeAuthenticationError({
      type: 'authentication_error',
      message: 'Not authenticated.',
    }),
    expectedCode: ErrorCode.Unauthorized,
    statusCode: 401,
  },

  {
    error: new Stripe.errors.StripePermissionError({
      type: 'invalid_grant',
      message: 'Permission error request.',
    }),
    expectedCode: ErrorCode.Forbidden,
    statusCode: 403,
  },

  {
    error: new Stripe.errors.StripeAPIError({
      type: 'api_error',
      message: 'Invalid request',
    }),
    expectedCode: ErrorCode.BadRequestError,
    statusCode: 400,
  },
];

// mock of stripe checkout session url
export const STRIPE_CHECKOUT_SESSION_URL = 'https://example.com';
