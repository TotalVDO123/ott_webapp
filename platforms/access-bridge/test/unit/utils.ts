import assert from 'assert';
import { IncomingMessage } from 'node:http';
import { Socket } from 'node:net';
import { describe, test } from 'node:test';

import jwt from 'jsonwebtoken';

import { isValidSiteId, parseAuthToken, parseJsonBody } from '../../src/utils.js';
import { SITE_ID } from '../fixtures.js';
import { AccessBridgeError, ErrorCode } from '../../src/errors.js';

// Mock secret and token creation
const secret = 'your-secret-key';
const validToken = jwt.sign({ aid: 123, sub: 'test@example.com' }, secret);
const invalidToken = jwt.sign({ uid: 123 }, secret); // Missing 'aid' and 'sub'
const malformedToken = 'malformed.token.structure';

// Helper function to create a bearer token
const createBearerToken = (token: string) => `Bearer ${token}`;

describe('parseAuthToken', () => {
  test('should parse valid bearer token', () => {
    const result = parseAuthToken(createBearerToken(validToken));
    assert.deepStrictEqual(result, { id: 123, email: 'test@example.com' });
  });

  test('should parse token with no Bearer prefix', () => {
    const result = parseAuthToken(validToken); // No 'Bearer ' prefix
    assert.deepStrictEqual(result, { id: 123, email: 'test@example.com' });
  });

  test('should return null for token missing required fields', () => {
    const result = parseAuthToken(createBearerToken(invalidToken));
    assert.strictEqual(result, null);
  });

  test('should return null for malformed token', () => {
    const result = parseAuthToken(createBearerToken(malformedToken));
    assert.strictEqual(result, null);
  });

  test('should return null for empty token', () => {
    const result = parseAuthToken('');
    assert.strictEqual(result, null);
  });

  test('should return null for undefined token', () => {
    const result = parseAuthToken(undefined as unknown as string);
    assert.strictEqual(result, null);
  });
});

// Helper function to create a mock IncomingMessage with a given body
function createMockRequest(body: string): IncomingMessage {
  const req = new IncomingMessage(new Socket());

  process.nextTick(() => {
    req.emit('data', body);
    req.emit('end');
  });

  return req;
}

describe('parseJsonBody', () => {
  test('should parse valid JSON body', async () => {
    const req = createMockRequest('{"key": "value"}');

    const result = await parseJsonBody<{ key: string }>(req);
    assert.deepStrictEqual(result, { key: 'value' });
  });

  test('should reject on invalid JSON body', async () => {
    const req = createMockRequest('invalid JSON');

    try {
      await parseJsonBody(req);
      assert.fail('Expected error not thrown');
    } catch (error) {
      if (error instanceof AccessBridgeError) {
        assert.strictEqual(error.code, ErrorCode.BadRequestError);
      } else {
        assert.fail(`Expected error to be an instance of AccessBridgeError, got ${typeof error}`);
      }
    }
  });

  test('should reject on request error', async () => {
    const req = new IncomingMessage(new Socket());

    // Simulate an error
    process.nextTick(() => {
      req.emit('error', new Error('Request error'));
    });

    try {
      await parseJsonBody(req);
      assert.fail('Expected error not thrown');
    } catch (error) {
      if (error instanceof Error) {
        assert.strictEqual(error.message, 'Request error');
      } else {
        assert.fail(`Expected error to be an instance of Error, got ${typeof error}`);
      }
    }
  });
});

describe('isValidSiteId', () => {
  test('should return true for valid site IDs', () => {
    assert.strictEqual(isValidSiteId(SITE_ID.VALID), true);
    assert.strictEqual(isValidSiteId(SITE_ID.VALID_UPPER), true);
  });

  test('should return false for invalid site IDs', () => {
    assert.strictEqual(isValidSiteId(SITE_ID.SHORT), false); // Less than 8 characters
    assert.strictEqual(isValidSiteId(SITE_ID.LONG), false); // More than 8 characters
    assert.strictEqual(isValidSiteId(SITE_ID.SPECIAL), false); // Special character
    assert.strictEqual(isValidSiteId(SITE_ID.EMPTY), false); // Empty string
  });
});
