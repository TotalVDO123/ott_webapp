import assert from 'assert';
import { describe, test, before, after } from 'node:test';

import { AccessController } from '../../src/controllers/AccessController.js';
import { MockServer } from '../mockServer.js';
import { AccessService } from '../../src/services/AccessService.js';
import { PlansService } from '../../src/services/PlansService.js';
import { ParameterInvalidError } from '../../src/errors.js';

// Mock AccessService
class MockAccessService extends AccessService {
  async generateAccessTokens() {
    return { passport: 'mock-passport', refresh_token: 'mock-refresh-token' };
  }

  async refreshAccessTokens(siteId: string, refreshToken: string) {
    if (refreshToken === 'valid-refresh-token') {
      return { passport: 'mock-passport', refresh_token: 'mock-refresh-token' };
    }
    throw new ParameterInvalidError({ parameterName: 'refresh_token' });
  }
}

// Mock PlansService
class MockPlansService extends PlansService {
  async getAccessControlPlans() {
    return [{ id: 'plan1234', exp: 1921396650 }];
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
      '/v2/sites/:site_id/access/generate': {
        PUT: accessController.generatePassport,
      },
      '/v2/sites/:site_id/access/refresh': {
        PUT: accessController.refreshPassport,
      },
    };

    mockServer = await MockServer.create(endpoints);
  });

  await test('should generate passport access tokens', (t, done) => {
    const requestOptions = {
      method: 'PUT',
      path: '/v2/sites/test1234/access/generate', // valid site_id format
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
          assert.strictEqual(responseBody.passport, 'mock-passport');
          assert.strictEqual(responseBody.refresh_token, 'mock-refresh-token');
          done();
        });
      })
      .end();
  });

  await test('should return ParameterInvalidError for invalid site_id', (t, done) => {
    const requestOptions = {
      method: 'PUT',
      path: '/v2/sites/invalid_site_id/access/generate', // invalid site_id format
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
          assert.strictEqual(responseBody.errors[0].code, 'parameter_invalid');
          done();
        });
      })
      .end();
  });

  await test('should refresh passport access tokens', (t, done) => {
    const requestOptions = {
      method: 'PUT',
      path: '/v2/sites/test1234/access/refresh',
      body: JSON.stringify({ refresh_token: 'valid-refresh-token' }),
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
          assert.strictEqual(responseBody.passport, 'mock-passport');
          assert.strictEqual(responseBody.refresh_token, 'mock-refresh-token');
          done();
        });
      })
      .end();
  });

  await test('should return ParameterInvalidError for invalid refresh token', (t, done) => {
    const requestOptions = {
      method: 'PUT',
      path: '/v2/sites/test1234/access/refresh',
      body: JSON.stringify({ refresh_token: 'invalid-refresh-token' }),
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
          assert.strictEqual(responseBody.errors[0].code, 'parameter_invalid');
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
