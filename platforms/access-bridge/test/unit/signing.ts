import assert from 'assert';
import { describe, test } from 'node:test';

import { AccessService } from '../../src/services/access-service.js';

describe('AccessService generateSignedUrl test', () => {
  const service = new AccessService();

  test('should generate a signed URL with the correct token', async () => {
    const path = '/path/to/resource';
    const clientHost = 'https://example.com';

    const result = await service.generateSignedUrl(path, clientHost);

    // Parse the result URL to extract the token
    const url = new URL(result);
    const token = url.searchParams.get('token');

    assert.strictEqual(result, `${clientHost}${path}?token=${token}`);
  });
});
