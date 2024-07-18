import assert from 'assert';
import { IncomingMessage } from 'node:http';
import { Socket } from 'node:net';
import { describe, test } from 'node:test';

import { isValidSiteId, parseJsonBody } from '../../src/utils.js';

describe('isValidSiteId', () => {
  test('should return true for valid site IDs', () => {
    assert.strictEqual(isValidSiteId('abcd1234'), true);
    assert.strictEqual(isValidSiteId('A1B2C3D4'), true);
  });

  test('should return false for invalid site IDs', () => {
    assert.strictEqual(isValidSiteId('abc123'), false); // Less than 8 characters
    assert.strictEqual(isValidSiteId('abcd12345'), false); // More than 8 characters
    assert.strictEqual(isValidSiteId('abcd123!'), false); // Special character
    assert.strictEqual(isValidSiteId(''), false); // Empty string
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
      if (error instanceof Error) {
        assert.strictEqual(error.message, 'Invalid JSON');
      } else {
        assert.fail(`Expected error to be an instance of Error, got ${typeof error}`);
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
