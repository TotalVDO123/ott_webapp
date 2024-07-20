import assert from 'assert';
import { IncomingMessage, ServerResponse } from 'http';
import test, { after, before, describe } from 'node:test';

import { BadRequestError, ParameterMissingError, sendErrors } from '../../src/errors.js';
import { MockServer } from '../mockServer.js';

describe('sendErrors', async () => {
  let mockServer: MockServer;

  before(async () => {
    const endpoints = {
      '/testBadRequest': {
        GET: async (req: IncomingMessage, res: ServerResponse) => {
          const error = new BadRequestError({});
          sendErrors(res, error);
        },
      },
      '/testMultipleErrors': {
        POST: async (req: IncomingMessage, res: ServerResponse) => {
          const error1 = new BadRequestError({});
          const error2 = new ParameterMissingError({ parameterName: 'apiKey' });
          sendErrors(res, error1, error2);
        },
      },
    };

    mockServer = await MockServer.create(endpoints);
  });

  await test('should send BadRequestError', (t, done) => {
    const requestOptions = {
      method: 'GET',
      path: '/testBadRequest',
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
          assert.deepStrictEqual(responseBody.errors[0].code, 'bad_request');
          done();
        });
      })
      .end();
  });

  await test('should send BadRequestError and ParameterMissingError', (t, done) => {
    const requestOptions = {
      method: 'POST',
      path: '/testMultipleErrors',
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
          assert.deepStrictEqual(responseBody.errors.length, 2);
          assert.deepStrictEqual(responseBody.errors[0].code, 'bad_request');
          assert.deepStrictEqual(responseBody.errors[1].code, 'parameter_missing');
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
