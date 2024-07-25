import assert from 'assert';
import { describe, test, before, after } from 'node:test';

import { AccessControlPlansParams } from '@jwp/ott-common/types/plans.js';
import { RefreshAccessTokensParams } from '@jwp/ott-common/types/access.js';

import { AccessController } from '../../src/controllers/access-controller.js';
import { MockServer } from '../mock-server.js';
import { AccessService } from '../../src/services/access-service.js';
import { PlansService } from '../../src/services/plans-service.js';
import { ErrorCode, ParameterInvalidError, UnauthorizedError } from '../../src/errors.js';
import { ACCESS_TOKENS, AUTHORIZATION, ENDPOINTS, PLANS, SITE_ID } from '../fixtures.js';

// Mock AccessService
class MockAccessService extends AccessService {
  async generateAccessTokens() {
    return { passport: ACCESS_TOKENS.PASSPORT.VALID, refresh_token: ACCESS_TOKENS.REFRESH_TOKEN.VALID };
  }

  async refreshAccessTokens({ siteId, refreshToken }: RefreshAccessTokensParams) {
    if (refreshToken === ACCESS_TOKENS.REFRESH_TOKEN.INVALID) {
      throw new ParameterInvalidError({ parameterName: 'refresh_token' });
    }
    return { passport: ACCESS_TOKENS.PASSPORT.VALID, refresh_token: ACCESS_TOKENS.REFRESH_TOKEN.VALID };
  }
}

// Mock PlansService
class MockPlansService extends PlansService {
  async getAccessControlPlans({ siteId, endpointType, authorization }: AccessControlPlansParams) {
    if (!authorization) {
      // mock the real scenario -> if no auth, only free plans available
      return PLANS.FREE;
    }

    if (authorization === AUTHORIZATION.INVALID) {
      throw new UnauthorizedError({});
    }

    return PLANS.VALID;
  }
}

describe('AccessController passport generate/refresh tests', async () => {
  let mockServer: MockServer;
  let accessController: AccessController;

  before(async () => {
    // Mock the controller's dependencies
    accessController = new AccessController();
    accessController['accessService'] = new MockAccessService();
    accessController['plansService'] = new MockPlansService();

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

  await test('should generate passport access tokens without authorization', (t, done) => {
    const requestOptions = {
      method: 'PUT',
      path: ENDPOINTS.GENERATE_TOKENS.replace(':site_id', SITE_ID.VALID),
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
          assert.strictEqual(responseBody.passport, ACCESS_TOKENS.PASSPORT.VALID);
          assert.strictEqual(responseBody.refresh_token, ACCESS_TOKENS.REFRESH_TOKEN.VALID);
          done();
        });
      })
      .end();
  });

  await test('should generate passport access tokens', (t, done) => {
    const requestOptions = {
      headers: {
        Authorization: AUTHORIZATION.VALID,
      },
      method: 'PUT',
      path: ENDPOINTS.GENERATE_TOKENS.replace(':site_id', SITE_ID.VALID),
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
          assert.strictEqual(responseBody.passport, ACCESS_TOKENS.PASSPORT.VALID);
          assert.strictEqual(responseBody.refresh_token, ACCESS_TOKENS.REFRESH_TOKEN.VALID);
          done();
        });
      })
      .end();
  });

  await test('should return UnauthorizedError for invalid authorization token', (t, done) => {
    const requestOptions = {
      headers: {
        Authorization: AUTHORIZATION.INVALID,
      },
      method: 'PUT',
      path: ENDPOINTS.GENERATE_TOKENS.replace(':site_id', SITE_ID.VALID),
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
    const requestOptions = {
      headers: {
        Authorization: AUTHORIZATION.VALID,
      },
      method: 'PUT',
      path: ENDPOINTS.GENERATE_TOKENS.replace(':site_id', SITE_ID.INVALID),
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

  await test('should refresh passport access tokens', (t, done) => {
    const requestOptions = {
      method: 'PUT',
      path: ENDPOINTS.REFRESH_TOKENS.replace(':site_id', SITE_ID.VALID),
      body: JSON.stringify({ refresh_token: ACCESS_TOKENS.REFRESH_TOKEN.VALID }),
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
          assert.strictEqual(responseBody.passport, ACCESS_TOKENS.PASSPORT.VALID);
          assert.strictEqual(responseBody.refresh_token, ACCESS_TOKENS.REFRESH_TOKEN.VALID);
          done();
        });
      })
      .end();
  });

  await test('should return ParameterInvalidError for invalid refresh token', (t, done) => {
    const requestOptions = {
      method: 'PUT',
      path: ENDPOINTS.REFRESH_TOKENS.replace(':site_id', SITE_ID.VALID),
      body: JSON.stringify({ refresh_token: ACCESS_TOKENS.REFRESH_TOKEN.INVALID }),
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

  // Close the mock server after all test suites have completed
  after(async () => {
    await mockServer.close();
  });
});
