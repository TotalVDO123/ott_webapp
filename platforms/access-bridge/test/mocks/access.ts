import { RefreshAccessTokensParams } from '@jwp/ott-common/types/access.js';
import { AccessControlPlansParams } from '@jwp/ott-common/types/plans.js';

import { ParameterInvalidError, UnauthorizedError } from '../../src/errors.js';
import { AccessService } from '../../src/services/access-service.js';
import { PlansService } from '../../src/services/plans-service.js';
import { ACCESS_TOKENS, PLANS, AUTHORIZATION } from '../fixtures.js';

// Mock AccessService
export class MockAccessService extends AccessService {
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
export class MockPlansService extends PlansService {
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
