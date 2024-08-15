import assert from 'assert';
import { describe, test, before, after } from 'node:test';

import { MockServer } from '../mock-server.js';
import { ErrorCode } from '../../src/errors.js';
import {
  STRIPE_CHECKOUT_SESSION_URL,
  VALID_PLAN_ID,
  SITE_ID,
  ENDPOINTS,
  STRIPE_PRICE,
  STRIPE_ERRORS,
  AUTHORIZATION,
} from '../fixtures.js';
import { MockCheckoutController } from '../mocks/checkout.js';

describe('CheckoutController tests', async () => {
  let mockServer: MockServer;
  let checkoutController: MockCheckoutController;

  before(async () => {
    checkoutController = new MockCheckoutController();

    const endpoints = {
      [ENDPOINTS.CHECKOUT]: {
        POST: checkoutController.initiateCheckout,
      },
    };

    mockServer = await MockServer.create(endpoints);
  });

  await test('should initiate checkout session successfully', (t, done) => {
    checkoutController['stripeService'].setMockBehavior('default');
    const requestBody = JSON.stringify({
      access_plan_id: VALID_PLAN_ID,
      price_id: STRIPE_PRICE.id,
      mode: 'subscription',
      success_url: 'http://example.com',
      cancel_url: 'http://example.com',
    });

    const requestOptions = {
      headers: {
        Authorization: AUTHORIZATION.VALID,
      },
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

  await test('should return UnauthorizedError for missing authorization token', (t, done) => {
    checkoutController['stripeService'].setMockBehavior('default');

    const requestOptions = {
      headers: {
        Authorization: AUTHORIZATION.MISSING,
      },
      method: 'POST',
      path: ENDPOINTS.CHECKOUT.replace(':site_id', SITE_ID.VALID),
    };

    mockServer
      .request(requestOptions, (res) => {
        assert.strictEqual(res.statusCode, 401);
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          const responseBody = JSON.parse(body);
          assert.strictEqual(responseBody.errors[0].code, ErrorCode.Unauthorized);
          done();
        });
      })
      .end();
  });

  await test('should return ParameterInvalidError for invalid site_id', (t, done) => {
    checkoutController['stripeService'].setMockBehavior('default');

    const requestOptions = {
      headers: {
        Authorization: AUTHORIZATION.VALID,
      },
      method: 'POST',
      path: ENDPOINTS.CHECKOUT.replace(':site_id', SITE_ID.INVALID),
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

  await test('should handle missing required parameters', (t, done) => {
    checkoutController['stripeService'].setMockBehavior('default');

    const requestBody = JSON.stringify({
      access_plan_id: VALID_PLAN_ID,
      price_id: STRIPE_PRICE.id,
      mode: 'payment',
      // missing success_url and cancel_url
    });

    const requestOptions = {
      headers: {
        Authorization: AUTHORIZATION.VALID,
      },
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

  // Iterate over each STRIPE_ERRORS case
  STRIPE_ERRORS.forEach(({ error, expectedCode, statusCode }) => {
    test(`should handle ${error.type} correctly`, (t, done) => {
      checkoutController['stripeService'].setMockBehavior('error', error);

      const requestBody = JSON.stringify({
        access_plan_id: VALID_PLAN_ID,
        price_id: STRIPE_PRICE.id,
        mode: 'subscription',
        success_url: 'http://example.com',
        cancel_url: 'http://example.com',
      });

      const requestOptions = {
        headers: {
          Authorization: AUTHORIZATION.VALID,
        },
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
