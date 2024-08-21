import { describe, it, expect } from 'vitest';

import { SITE_ID } from '../fixtures.js';
import { isValidSiteId } from '../../src/utils.js';

describe('isValidSiteId', () => {
  // Define parameterized test cases
  const validSiteIds = [
    { siteId: SITE_ID.VALID, expected: true },
    { siteId: SITE_ID.VALID_UPPER, expected: true },
  ];

  const invalidSiteIds = [
    { siteId: SITE_ID.SHORT, expected: false }, // Less than 8 characters
    { siteId: SITE_ID.LONG, expected: false }, // More than 8 characters
    { siteId: SITE_ID.SPECIAL, expected: false }, // Special character
    { siteId: SITE_ID.EMPTY, expected: false }, // Empty string
  ];

  // Valid site IDs
  it.each(validSiteIds)('should return true for valid site ID: $siteId', ({ siteId, expected }) => {
    expect(isValidSiteId(siteId)).toBe(expected);
  });

  // Invalid site IDs
  it.each(invalidSiteIds)('should return false for invalid site ID: $siteId', ({ siteId, expected }) => {
    expect(isValidSiteId(siteId)).toBe(expected);
  });
});
