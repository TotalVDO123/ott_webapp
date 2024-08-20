import http from 'http';

import { describe, it, beforeAll, afterAll, expect } from 'vitest';

import { AccessController } from '../../src/controllers/access-controller.js';
import { MockServer } from '../mock-server.js';
import { ErrorCode } from '../../src/errors.js';
import { ACCESS_TOKENS, AUTHORIZATION, ENDPOINTS, SITE_ID } from '../fixtures.js';
import { MockAccessController } from '../mocks/access.js';

describe('AccessController passport generate/refresh tests', () => {
  let mockServer: MockServer;
  let accessController: AccessController;

  beforeAll(async () => {
    accessController = new MockAccessController();

    const endpoints = {
      [ENDPOINTS.GENERATE_TOKENS]: {
        PUT: accessController.generatePassport,
      },
      [ENDPOINTS.REFRESH_TOKENS]: {
        PUT: accessController.refreshPassport,
      },
    };

    mockServer = await MockServer.create(endpoints);
  });

  const testCases = [
    {
      description: 'should generate passport access tokens without authorization',
      requestOptions: {
        method: 'PUT',
        path: ENDPOINTS.GENERATE_TOKENS.replace(':site_id', SITE_ID.VALID),
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
        path: ENDPOINTS.GENERATE_TOKENS.replace(':site_id', SITE_ID.VALID),
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
        path: ENDPOINTS.GENERATE_TOKENS.replace(':site_id', SITE_ID.VALID),
      },
      expectedStatusCode: 401,
      expectedError: ErrorCode.Unauthorized,
    },
    {
      description: 'should return ParameterInvalidError for invalid site_id',
      requestOptions: {
        headers: { Authorization: AUTHORIZATION.VALID },
        method: 'PUT',
        path: ENDPOINTS.GENERATE_TOKENS.replace(':site_id', SITE_ID.INVALID),
      },
      expectedStatusCode: 400,
      expectedError: ErrorCode.ParameterInvalid,
    },
    {
      description: 'should refresh passport access tokens',
      requestOptions: {
        method: 'PUT',
        path: ENDPOINTS.REFRESH_TOKENS.replace(':site_id', SITE_ID.VALID),
        body: JSON.stringify({ refresh_token: ACCESS_TOKENS.REFRESH_TOKEN.VALID }),
      },
      expectedStatusCode: 200,
      expectedResponse: {
        passport: ACCESS_TOKENS.PASSPORT.VALID,
        refresh_token: ACCESS_TOKENS.REFRESH_TOKEN.VALID,
      },
    },
    {
      description: 'should return ParameterInvalidError for invalid refresh token',
      requestOptions: {
        method: 'PUT',
        path: ENDPOINTS.REFRESH_TOKENS.replace(':site_id', SITE_ID.VALID),
        body: JSON.stringify({ refresh_token: ACCESS_TOKENS.REFRESH_TOKEN.INVALID }),
      },
      expectedStatusCode: 400,
      expectedError: ErrorCode.ParameterInvalid,
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
