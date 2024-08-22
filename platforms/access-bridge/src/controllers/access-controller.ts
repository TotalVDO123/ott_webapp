import { Request, Response, NextFunction } from 'express';
import { AccessControlPlan } from '@jwp/ott-common/types/plans.js';

import { AccessBridgeError, ErrorDefinitions, sendErrors } from '../errors.js';
import { PassportService } from '../services/passport-service.js';
import { PlansService } from '../services/plans-service.js';
import { isValidSiteId } from '../utils.js';
import { IdentityService, Viewer } from '../services/identity-service.js';

/**
 * Controller class responsible for handling access-related services.
 * The controller interacts with services for identity management, plans management, and passport generation.
 */
export class AccessController {
  private identityService: IdentityService;
  private passportService: PassportService;
  private plansService: PlansService;

  constructor() {
    this.identityService = new IdentityService();
    this.passportService = new PassportService();
    this.plansService = new PlansService();
  }

  /**
   * Service handler for generating passport access tokens based on the provided site ID
   * and authorization token. Validates the site ID, checks user authorization, retrieves
   * access control plans, and generates access tokens. Sends appropriate error responses
   * for invalid requests.
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next middleware function
   */
  async generatePassport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const siteId = req.params.site_id;
      if (!isValidSiteId(siteId)) {
        sendErrors(res, ErrorDefinitions.ParameterInvalidError.create({ parameterName: 'site_id' }));
        return;
      }

      // unauthorized is default for viewers without an authorization token
      let viewer: Viewer = { id: 'unauthorized', email: '' };

      const authorization = req.headers['authorization'];

      if (authorization) {
        viewer = await this.identityService.getAccount({ authorization });
        if (!viewer.id || !viewer.email) {
          sendErrors(res, ErrorDefinitions.UnauthorizedError.create());
          return;
        }
      }

      const accessControlPlans = await this.plansService.getAccessControlPlans({
        siteId,
        endpointType: 'entitlements',
        authorization,
      });

      // map to exclude the external_providers since it's not needed in the passport data
      const plans: AccessControlPlan[] = accessControlPlans.map(({ id, exp }) => ({ id, exp }));

      // Generate access tokens for the given site, viewer and plans.
      const accessTokens = await this.passportService.generatePassport({
        siteId,
        viewerId: viewer.id,
        plans,
      });

      res.json(accessTokens);
    } catch (error) {
      if (error instanceof AccessBridgeError) {
        sendErrors(res, error);
        return;
      }
      console.error('Controller: failed to generate passport.', error);
      next(error);
    }
  }
}
