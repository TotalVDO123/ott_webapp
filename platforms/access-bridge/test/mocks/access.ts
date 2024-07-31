import { RefreshAccessTokensParams } from '@jwp/ott-common/types/access.js';
import { AccessControlPlansParams } from '@jwp/ott-common/types/plans.js';

import { ParameterInvalidError, UnauthorizedError } from '../../src/errors.js';
import { AccessService } from '../../src/services/access-service.js';
import { PlansService } from '../../src/services/plans-service.js';
import { ACCESS_TOKENS, PLANS, AUTHORIZATION, VIEWER } from '../fixtures.js';
import { AccountService } from '../../src/services/account-service.js';
import { AccessController } from '../../src/controllers/access-controller.js';

// Mock AccountService
class MockAccountService extends AccountService {
  async getAccount({ authorization }: { authorization: string }) {
    if (authorization === AUTHORIZATION.INVALID) {
      throw new UnauthorizedError({});
    }

    return VIEWER;
  }
}

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
      // if no auth, only free plans available
      return PLANS.FREE;
    }

    return PLANS.VALID;
  }
}

export class MockAccessController extends AccessController {
  constructor() {
    super();
    Reflect.set(this, 'accountService', new MockAccountService());
    Reflect.set(this, 'accessService', new MockAccessService());
    Reflect.set(this, 'plansService', new MockPlansService());
  }
}
