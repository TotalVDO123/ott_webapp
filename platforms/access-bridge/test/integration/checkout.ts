import assert from 'assert';
import { describe, test, before, after } from 'node:test';

import { StripeCheckoutParams } from '@jwp/ott-common/types/stripe.js';
import Stripe from 'stripe';
import { AccessControlPlansParams } from '@jwp/ott-common/types/plans.js';

import { MockServer } from '../mock-server.js';
import { CheckoutController } from '../../src/controllers/checkout-controller.js';
import { StripeService } from '../../src/services/stripe-service.js';
import { PlansService } from '../../src/services/plans-service.js';
import { AccessBridgeError, BadRequestError, ErrorCode, ForbiddenError, UnauthorizedError } from '../../src/errors.js';
import {
  STRIPE_CHECKOUT_SESSION_URL,
  VALID_PLAN_ID,
  SITE_ID,
  ENDPOINTS,
  PLANS,
  STRIPE_PRICE,
  STRIPE_ERRORS,
} from '../fixtures.js';

// Mock PlansService
class MockPlansService extends PlansService {
  async getAccessControlPlans({ siteId, endpointType, authorization }: AccessControlPlansParams) {
    return PLANS.VALID;
  }
}

// Mock StripeService
class MockStripeService extends StripeService {
  private mockBehavior: 'default' | 'error' = 'default';
  private mockError: AccessBridgeError | null = null;

  // Method to set the mock behavior
  setMockBehavior(behavior: 'default' | 'error', error?: Stripe.errors.StripeError) {
    this.mockBehavior = behavior;

    if (behavior === 'error' && error instanceof Stripe.errors.StripeError) {
      switch (error.type) {
        case 'StripeInvalidRequestError':
          this.mockError = new BadRequestError({});
          break;
        case 'StripeAuthenticationError':
          this.mockError = new UnauthorizedError({});
          break;
        case 'StripePermissionError':
          this.mockError = new ForbiddenError({});
          break;
        default:
          this.mockError = new BadRequestError({});
      }
    }
  }

  async createCheckoutSession(params: StripeCheckoutParams) {
    if (this.mockBehavior === 'error' && this.mockError) {
      throw this.mockError;
    }

    return { url: STRIPE_CHECKOUT_SESSION_URL } as Stripe.Checkout.Session;
  }
}

describe('CheckoutController tests', async () => {
  let mockServer: MockServer;
  let checkoutController: CheckoutController;
  let mockStripeService: MockStripeService;

  before(async () => {
    // Initialize the controller and inject the mock services
    checkoutController = new CheckoutController();
    mockStripeService = new MockStripeService('mock-api-key');
    checkoutController['stripeService'] = mockStripeService;
    checkoutController['plansService'] = new MockPlansService();

    const endpoints = {
      [ENDPOINTS.CHECKOUT]: {
        POST: checkoutController.initiateCheckout,
      },
    };

    mockServer = await MockServer.create(endpoints);
  });

  await test('should initiate checkout session successfully', (t, done) => {
    mockStripeService.setMockBehavior('default');
    const requestBody = JSON.stringify({
      access_plan_id: VALID_PLAN_ID,
      price_id: STRIPE_PRICE.id,
      mode: 'subscription',
      redirect_url: 'http://example.com',
    });

    const requestOptions = {
      method: 'POST',
      path: ENDPOINTS.CHECKOUT.replace(':site_id', SITE_ID.VALID),
      body: requestBody,
    };

    mockServer
      .request(requestOptions, (res) => {
        assert.strictEqual(res.statusCode, 200);
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          const responseBody = JSON.parse(body);
          assert.strictEqual(responseBody.url, STRIPE_CHECKOUT_SESSION_URL);
          done();
        });
      })
      .end();
  });

  await test('should handle missing required parameters', (t, done) => {
    mockStripeService.setMockBehavior('default');

    const requestBody = JSON.stringify({
      access_plan_id: VALID_PLAN_ID,
      price_id: STRIPE_PRICE.id,
      mode: 'payment',
      // missing redirect_url
    });

    const requestOptions = {
      method: 'POST',
      path: ENDPOINTS.CHECKOUT.replace(':site_id', SITE_ID.VALID),
      body: requestBody,
    };

    mockServer
      .request(requestOptions, (res) => {
        assert.strictEqual(res.statusCode, 400);
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          const responseBody = JSON.parse(body);
          assert.strictEqual(responseBody.errors[0].code, ErrorCode.ParameterMissing);
          done();
        });
      })
      .end();
  });

  // // Will be uncommented once SIMS API is updated to include the access_plan_ids for validation
  //   await test('should return ParameterInvalidError for invalid access_plan_id', (t, done) => {
  //     mockStripeService.setMockBehavior('default');

  //     const requestBody = JSON.stringify({
  //       access_plan_id: PLANS.INVALID[0].id,
  //       price_id: STRIPE_PRICE.id,
  //       mode: 'payment',
  //       redirect_url: 'http://example.com',
  //     });

  //     const requestOptions = {
  //       method: 'POST',
  //       path: ENDPOINTS.CHECKOUT.replace(':site_id', SITE_ID.VALID),
  //       body: requestBody,
  //     };

  //     mockServer
  //       .request(requestOptions, (res) => {
  //         assert.strictEqual(res.statusCode, 400);
  //         let body = '';
  //         res.on('data', (chunk) => {
  //           body += chunk;
  //         });
  //         res.on('end', () => {
  //           const responseBody = JSON.parse(body);
  //           assert.strictEqual(responseBody.errors[0].code, ErrorCode.ParameterInvalid);
  //           done();
  //         });
  //       })
  //       .end();
  //   });

  // Iterate over each STRIPE_ERRORS case
  STRIPE_ERRORS.forEach(({ error, expectedCode, statusCode }) => {
    test(`should handle ${error.type} correctly`, (t, done) => {
      mockStripeService.setMockBehavior('error', error);

      const requestBody = JSON.stringify({
        access_plan_id: VALID_PLAN_ID,
        price_id: STRIPE_PRICE.id,
        mode: 'subscription',
        redirect_url: 'http://example.com',
      });

      const requestOptions = {
        method: 'POST',
        path: ENDPOINTS.CHECKOUT.replace(':site_id', SITE_ID.VALID),
        body: requestBody,
      };

      mockServer
        .request(requestOptions, (res) => {
          assert.strictEqual(res.statusCode, statusCode);
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            const responseBody = JSON.parse(body);
            assert.strictEqual(responseBody.errors[0].code, expectedCode);
            done();
          });
        })
        .end();
    });
  });

  after(async () => {
    await mockServer.close();
  });
});
