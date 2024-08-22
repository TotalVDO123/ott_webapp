import { PassportService } from '../../src/services/passport-service.js';
import { AccessControlPlansParams, PlansService } from '../../src/services/plans-service.js';
import { ACCESS_TOKENS, PLANS, AUTHORIZATION, VIEWER } from '../fixtures.js';
import { IdentityService } from '../../src/services/identity-service.js';
import { AccessController } from '../../src/controllers/access-controller.js';
import { ErrorDefinitions } from '../../src/errors.js';

// Mock IdentityService
class MockIdentityService extends IdentityService {
  async getAccount({ authorization }: { authorization: string }) {
    if (authorization === AUTHORIZATION.INVALID) {
      throw ErrorDefinitions.UnauthorizedError.create();
    }

    return VIEWER;
  }
}

// Mock PassportService
class MockPassportService extends PassportService {
  async generatePassport() {
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
    Reflect.set(this, 'identityService', new MockIdentityService());
    Reflect.set(this, 'passportService', new MockPassportService());
    Reflect.set(this, 'plansService', new MockPlansService());
  }
}
