import assert from 'assert';
import { describe, test, before, after } from 'node:test';

import { MockServer } from '../mock-server.js';
import { ENDPOINTS, SITE_ID, STRIPE_ERRORS, STRIPE_PRODUCT } from '../fixtures.js';
import { ProductsController } from '../../src/controllers/products-controller.js';
import { ErrorCode } from '../../src/errors.js';
import { MockPlansService, MockStripeService } from '../mocks/products.js';

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
        GET: productsController.getProducts,
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
