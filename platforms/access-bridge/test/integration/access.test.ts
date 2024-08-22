import http from 'http';

import { Express, NextFunction, Response, Request } from 'express';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';

import { AccessController } from '../../src/controllers/access-controller.js';
import { MockServer } from '../mock-server.js';
import { ACCESS_TOKENS, AUTHORIZATION, ENDPOINTS, SITE_ID } from '../fixtures.js';
import { MockAccessController } from '../mocks/access.js';
import { ErrorDefinitions } from '../../src/errors.js';

describe('AccessController tests', () => {
  let mockServer: MockServer;
  let accessController: AccessController;

  beforeAll(async () => {
    accessController = new MockAccessController();

    const registerEndpoints = (app: Express) => {
      app.put(ENDPOINTS.GENERATE_PASSPORT, (req: Request, res: Response, next: NextFunction) => {
        accessController.generatePassport(req, res, next);
      });
    };

    mockServer = await MockServer.create(registerEndpoints);
  });

  const testCases = [
    {
      description: 'should generate passport access tokens without authorization',
      requestOptions: {
        method: 'PUT',
        path: ENDPOINTS.GENERATE_PASSPORT.replace(':site_id', SITE_ID.VALID),
      },
      expectedStatusCode: 200,
      expectedResponse: {
        passport: ACCESS_TOKENS.PASSPORT.VALID,
        refresh_token: ACCESS_TOKENS.REFRESH_TOKEN.VALID,
      },
    },
    {
      description: 'should generate passport access tokens with valid authorization',
      requestOptions: {
        headers: { Authorization: AUTHORIZATION.VALID },
        method: 'PUT',
        path: ENDPOINTS.GENERATE_PASSPORT.replace(':site_id', SITE_ID.VALID),
      },
      expectedStatusCode: 200,
      expectedResponse: {
        passport: ACCESS_TOKENS.PASSPORT.VALID,
        refresh_token: ACCESS_TOKENS.REFRESH_TOKEN.VALID,
      },
    },
    {
      description: 'should return UnauthorizedError for invalid authorization',
      requestOptions: {
        headers: { Authorization: AUTHORIZATION.INVALID },
        method: 'PUT',
        path: ENDPOINTS.GENERATE_PASSPORT.replace(':site_id', SITE_ID.VALID),
      },
      expectedStatusCode: 401,
      expectedError: ErrorDefinitions.UnauthorizedError.code,
    },
    {
      description: 'should return ParameterInvalidError for invalid site_id',
      requestOptions: {
        headers: { Authorization: AUTHORIZATION.VALID },
        method: 'PUT',
        path: ENDPOINTS.GENERATE_PASSPORT.replace(':site_id', SITE_ID.INVALID),
      },
      expectedStatusCode: 400,
      expectedError: ErrorDefinitions.ParameterInvalidError.code,
    },
  ];

  it.each(testCases)(
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

  afterAll(async () => {
    await mockServer.close();
  });
});
