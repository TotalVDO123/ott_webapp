import http from 'http';

import { Express, NextFunction, Request, Response } from 'express';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';

import { MockServer } from '../mock-server.js';
import { ErrorDefinitions } from '../../src/errors.js';
import {
  STRIPE_SESSION_URL,
  VALID_PLAN_ID,
  ENDPOINTS,
  STRIPE_PRICE,
  STRIPE_ERRORS,
  AUTHORIZATION,
} from '../fixtures.js';
import { MockCheckoutController } from '../mocks/checkout.js';

describe('CheckoutController tests', () => {
  let mockServer: MockServer;
  let checkoutController: MockCheckoutController;

  beforeAll(async () => {
    checkoutController = new MockCheckoutController();

    const registerEndpoints = (app: Express) => {
      app.post(ENDPOINTS.CHECKOUT, (req: Request, res: Response, next: NextFunction) => {
        checkoutController.initiateCheckout(req, res, next);
      });
      app.post(ENDPOINTS.BILLING_PORTAL, (req: Request, res: Response, next: NextFunction) => {
        checkoutController.generateBillingPortalURL(req, res, next);
      });
    };

    mockServer = await MockServer.create(registerEndpoints);
  });

  const checkoutTestCases = [
    {
      description: 'should initiate checkout session successfully',
      requestOptions: {
        headers: {
          Authorization: AUTHORIZATION.VALID,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        path: ENDPOINTS.CHECKOUT,
        body: JSON.stringify({
          price_id: STRIPE_PRICE.id,
          mode: 'subscription',
          redirect_url: 'http://example.com',
        }),
      },
      expectedStatusCode: 200,
      expectedResponse: {
        url: STRIPE_SESSION_URL,
      },
    },
    {
      description: 'should return UnauthorizedError for missing authorization token',
      requestOptions: {
        headers: {
          Authorization: AUTHORIZATION.MISSING,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        path: ENDPOINTS.CHECKOUT,
      },
      expectedStatusCode: 401,
      expectedError: ErrorDefinitions.UnauthorizedError.code,
    },
    {
      description: 'should handle missing required parameters',
      requestOptions: {
        headers: {
          Authorization: AUTHORIZATION.VALID,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        path: ENDPOINTS.CHECKOUT,
        body: JSON.stringify({
          price_id: STRIPE_PRICE.id,
          mode: 'payment',
          // missing redirect_url
        }),
      },
      expectedStatusCode: 400,
      expectedError: ErrorDefinitions.ParameterMissingError.code,
    },
  ];

  const billingPortalTestCases = [
    {
      description: 'should create billing portal URL successfully',
      requestOptions: {
        headers: {
          Authorization: AUTHORIZATION.VALID,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        path: ENDPOINTS.BILLING_PORTAL,
        body: JSON.stringify({
          return_url: 'http://example.com',
        }),
      },
      expectedStatusCode: 200,
      expectedResponse: {
        url: STRIPE_SESSION_URL,
      },
    },
    {
      description: 'should return UnauthorizedError for missing authorization token in billing portal',
      requestOptions: {
        headers: {
          Authorization: AUTHORIZATION.MISSING,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        path: ENDPOINTS.BILLING_PORTAL,
      },
      expectedStatusCode: 401,
      expectedError: ErrorDefinitions.UnauthorizedError.code,
    },
    {
      description: 'should handle missing required parameters in billing portal',
      requestOptions: {
        headers: {
          Authorization: AUTHORIZATION.VALID,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        path: ENDPOINTS.BILLING_PORTAL,
        body: JSON.stringify({
          // missing return_url
        }),
      },
      expectedStatusCode: 400,
      expectedError: ErrorDefinitions.ParameterMissingError.code,
    },
  ];

  const allTestCases = [...checkoutTestCases, ...billingPortalTestCases];

  it.each(allTestCases)(
    '$description',
    async ({ requestOptions, expectedStatusCode, expectedResponse, expectedError }) => {
      const response = await new Promise<http.IncomingMessage>((resolve) => {
        mockServer.request(requestOptions, resolve).end();
      });
      expect(response.statusCode).toBe(expectedStatusCode);

      const body = await new Promise<string>((resolve) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          resolve(data);
        });
      });

      const responseBody = JSON.parse(body);

      if (expectedResponse) {
        expect(responseBody).toMatchObject(expectedResponse);
      } else if (expectedError) {
        expect(responseBody.errors[0].code).toBe(expectedError);
      }
    }
  );

  STRIPE_ERRORS.forEach(({ error, expectedCode, statusCode }) => {
    it(`should handle ${error.type} correctly`, async () => {
      checkoutController['stripeService'].setMockBehavior('error', error);

      const requestBody = JSON.stringify({
        access_plan_id: VALID_PLAN_ID,
        price_id: STRIPE_PRICE.id,
        mode: 'subscription',
        redirect_url: 'http://example.com',
      });

      const requestOptions = {
        headers: {
          Authorization: AUTHORIZATION.VALID,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        path: ENDPOINTS.CHECKOUT,
        body: requestBody,
      };

      const response = await new Promise<http.IncomingMessage>((resolve) => {
        mockServer.request(requestOptions, resolve).end();
      });

      expect(response.statusCode).toBe(statusCode);

      const body = await new Promise<string>((resolve) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          resolve(data);
        });
      });

      const responseBody = JSON.parse(body);
      expect(responseBody.errors[0].code).toBe(expectedCode);
    });
  });

  afterAll(async () => {
    await mockServer.close();
  });
});
