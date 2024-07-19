import assert from 'assert';
import { describe, test } from 'node:test';

import {
  BadRequestError,
  ForbiddenError,
  InternalError,
  MethodNotAllowedError,
  NotFoundError,
  ParameterInvalidError,
  ParameterMissingError,
} from '../../src/errors.js';

describe('Error Classes', () => {
  test('should create BadRequestError correctly', () => {
    const error = new BadRequestError({});
    assert.strictEqual(error.code, 'bad_request');
    assert.strictEqual(error.statusCode, 400);
    assert.strictEqual(error.description, 'The request was not constructed correctly.');
  });

  test('should create ParameterMissingError correctly', () => {
    const error = new ParameterMissingError({ parameterName: 'param' });
    assert.strictEqual(error.code, 'parameter_missing');
    assert.strictEqual(error.statusCode, 400);
    assert.strictEqual(error.description, 'Required parameter "param" was missing.');
  });

  test('should create ParameterInvalidError correctly', () => {
    const error = new ParameterInvalidError({ parameterName: 'param', reason: 'is invalid' });
    assert.strictEqual(error.code, 'parameter_invalid');
    assert.strictEqual(error.statusCode, 400);
    assert.strictEqual(error.description, 'Parameter "param" is invalid.');
  });

  test('should create ForbiddenError correctly', () => {
    const error = new ForbiddenError({});
    assert.strictEqual(error.code, 'forbidden');
    assert.strictEqual(error.statusCode, 403);
    assert.strictEqual(error.description, 'Access to the requested resource is not allowed.');
  });

  test('should create NotFoundError correctly', () => {
    const error = new NotFoundError({});
    assert.strictEqual(error.code, 'not_found');
    assert.strictEqual(error.statusCode, 404);
    assert.strictEqual(error.description, 'The requested resource could not be found.');
  });

  test('should create MethodNotAllowedError correctly', () => {
    const error = new MethodNotAllowedError({ allowedMethods: ['GET', 'POST'] });
    assert.strictEqual(error.code, 'method_not_allowed');
    assert.strictEqual(error.statusCode, 405);
    assert.strictEqual(error.description, 'The requested resource only supports GET, POST requests.');
    assert.deepStrictEqual(error.headers, [['Allow', 'GET, POST']]);
  });

  test('should create InternalError correctly', () => {
    const error = new InternalError({});
    assert.strictEqual(error.code, 'internal_error');
    assert.strictEqual(error.statusCode, 500);
    assert.strictEqual(error.description, 'An error was encountered while processing the request. Please try again.');
  });
});
