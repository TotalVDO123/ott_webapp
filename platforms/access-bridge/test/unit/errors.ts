import assert from 'assert';
import { describe, test } from 'node:test';

import {
  BadRequestError,
  ErrorCode,
  ForbiddenError,
  getErrorCodeDescription,
  InternalError,
  MethodNotAllowedError,
  NotFoundError,
  ParameterInvalidError,
  ParameterMissingError,
  UnauthorizedError,
} from '../../src/errors.js';
import { RequestMethod } from '../../src/http.js';

describe('Error Classes', () => {
  test('should create BadRequestError correctly', () => {
    const error = new BadRequestError({});
    assert.strictEqual(error.code, ErrorCode.BadRequestError);
    assert.strictEqual(error.statusCode, 400);
    assert.strictEqual(error.description, getErrorCodeDescription(ErrorCode.BadRequestError));
  });

  test('should create ParameterMissingError correctly', () => {
    const error = new ParameterMissingError({ parameterName: 'param' });
    assert.strictEqual(error.code, ErrorCode.ParameterMissing);
    assert.strictEqual(error.statusCode, 400);
    assert.strictEqual(error.description, getErrorCodeDescription(ErrorCode.ParameterMissing, 'param'));
  });

  test('should create ParameterInvalidError correctly', () => {
    const error = new ParameterInvalidError({ parameterName: 'param', reason: 'is invalid' });
    assert.strictEqual(error.code, 'parameter_invalid');
    assert.strictEqual(error.statusCode, 400);
    assert.strictEqual(error.description, getErrorCodeDescription(ErrorCode.ParameterInvalid, 'param', 'is invalid'));
  });

  test('should create ForbiddenError correctly', () => {
    const error = new ForbiddenError({});
    assert.strictEqual(error.code, ErrorCode.Forbidden);
    assert.strictEqual(error.statusCode, 403);
    assert.strictEqual(error.description, getErrorCodeDescription(ErrorCode.Forbidden));
  });

  test('should create UnauthorizedError correctly', () => {
    const error = new UnauthorizedError({});
    assert.strictEqual(error.code, ErrorCode.Unauthorized);
    assert.strictEqual(error.statusCode, 401);
    assert.strictEqual(error.description, getErrorCodeDescription(ErrorCode.Unauthorized));
  });

  test('should create NotFoundError correctly', () => {
    const error = new NotFoundError({});
    assert.strictEqual(error.code, ErrorCode.NotFound);
    assert.strictEqual(error.statusCode, 404);
    assert.strictEqual(error.description, getErrorCodeDescription(ErrorCode.NotFound));
  });

  test('should create MethodNotAllowedError correctly', () => {
    const allowedMethods: RequestMethod[] = ['GET', 'PUT'];
    const error = new MethodNotAllowedError({ allowedMethods });
    assert.strictEqual(error.code, ErrorCode.MethodNotAllowed);
    assert.strictEqual(error.statusCode, 405);
    assert.strictEqual(
      error.description,
      getErrorCodeDescription(ErrorCode.MethodNotAllowed, allowedMethods.sort().join(', '))
    );
    assert.deepStrictEqual(error.headers, [['Allow', 'GET, PUT']]);
  });

  test('should create InternalError correctly', () => {
    const error = new InternalError({});
    assert.strictEqual(error.code, ErrorCode.InternalError);
    assert.strictEqual(error.statusCode, 500);
    assert.strictEqual(error.description, getErrorCodeDescription(ErrorCode.InternalError));
  });
});
