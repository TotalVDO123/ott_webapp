import assert from 'assert';
import { describe, test, before, after } from 'node:test';

import Stripe from 'stripe';

import { MockServer } from '../mock-server.js';
import { StripeService } from '../../src/services/stripe-service.js';
import { ENDPOINTS, PLANS, SITE_ID, STRIPE_ERRORS, STRIPE_PRODUCT, VALID_PLAN_ID } from '../fixtures.js';
import { ProductsController } from '../../src/controllers/products-controller.js';
import { AccessControlPlansParams, PlansService } from '../../src/services/plans-service.js';
import { AccessBridgeError, BadRequestError, ErrorCode, ForbiddenError, UnauthorizedError } from '../../src/errors.js';

// Mock PlansService
class MockPlansService extends PlansService {
  async getAccessControlPlans({ siteId, endpointType, authorization }: AccessControlPlansParams) {
    return PLANS.VALID;
  }
}

// Mock StripeService
class MockStripeService extends StripeService {
  private mockBehavior: 'default' | 'empty' | 'error' = 'default';
  private mockError: AccessBridgeError | null = null;

  // Method to set the mock behavior
  setMockBehavior(behavior: 'default' | 'empty' | 'error', error?: Stripe.errors.StripeError) {
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

  async getStripeProductsWithPrices(accessPlanIds: string[]) {
    if (this.mockBehavior === 'error' && this.mockError) {
      throw this.mockError;
    }

    if (this.mockBehavior === 'empty') {
      return [];
    }

    return [STRIPE_PRODUCT];
  }
}

describe('ProductsController tests', async () => {
  let mockServer: MockServer;
  let productsController: ProductsController;
  let mockStripeService: MockStripeService;

  before(async () => {
    // Initialize the controller and inject the mock services
    productsController = new ProductsController();
    mockStripeService = new MockStripeService('mock-api-key');
    productsController['stripeService'] = mockStripeService;
    productsController['plansService'] = new MockPlansService();

    const endpoints = {
      [ENDPOINTS.PRODUCTS]: {
        GET: productsController.getStripeProducts,
      },
    };

    mockServer = await MockServer.create(endpoints);
  });

  await test('should list stripe products', (t, done) => {
    mockStripeService.setMockBehavior('default');

    const requestOptions = {
      method: 'GET',
      path: ENDPOINTS.PRODUCTS.replace(':site_id', SITE_ID.VALID),
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
          assert.strictEqual(responseBody[0].id, STRIPE_PRODUCT.id);
          assert.strictEqual(responseBody[0].name, STRIPE_PRODUCT.name);
          assert.strictEqual(responseBody[0].default_price, STRIPE_PRODUCT.default_price);
          assert.strictEqual(responseBody[0].metadata.access_plan_id, VALID_PLAN_ID);
          done();
        });
      })
      .end();
  });

  await test('should handle empty products', (t, done) => {
    mockStripeService.setMockBehavior('empty');

    const requestOptions = {
      method: 'GET',
      path: ENDPOINTS.PRODUCTS.replace(':site_id', SITE_ID.VALID),
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
          assert.deepStrictEqual(responseBody, []);
          done();
        });
      })
      .end();
  });

  await test('should return ParameterInvalidError for invalid site_id', (t, done) => {
    const requestOptions = {
      method: 'GET',
      path: ENDPOINTS.PRODUCTS.replace(':site_id', SITE_ID.INVALID),
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
          assert.strictEqual(responseBody.errors[0].code, ErrorCode.ParameterInvalid);
          done();
        });
      })
      .end();
  });

  await test('should return MethodNotAllowed for invalid method provided', (t, done) => {
    const requestOptions = {
      method: 'POST',
      path: ENDPOINTS.PRODUCTS.replace(':site_id', SITE_ID.VALID),
    };

    mockServer
      .request(requestOptions, (res) => {
        assert.strictEqual(res.statusCode, 405);
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          const responseBody = JSON.parse(body);
          assert.strictEqual(responseBody.errors[0].code, ErrorCode.MethodNotAllowed);
          done();
        });
      })
      .end();
  });

  await test('should return NotFoundError for invalid route', (t, done) => {
    const requestOptions = {
      method: 'GET',
      path: `${ENDPOINTS.PRODUCTS.replace(':site_id', SITE_ID.INVALID)}/invalid`,
    };

    mockServer
      .request(requestOptions, (res) => {
        assert.strictEqual(res.statusCode, 404);
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          const responseBody = JSON.parse(body);
          assert.strictEqual(responseBody.errors[0].code, ErrorCode.NotFound);
          done();
        });
      })
      .end();
  });

  // Iterate over each STRIPE_ERRORS case
  STRIPE_ERRORS.forEach(({ error, expectedCode, statusCode }) => {
    test(`should handle ${error.type} correctly`, (t, done) => {
      mockStripeService.setMockBehavior('error', error);

      const requestOptions = {
        method: 'GET',
        path: ENDPOINTS.PRODUCTS.replace(':site_id', SITE_ID.VALID),
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
