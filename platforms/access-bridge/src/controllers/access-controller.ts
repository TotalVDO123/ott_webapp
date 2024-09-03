import { Request, Response, NextFunction } from 'express';

import { ErrorDefinitions, sendErrors } from '../errors.js';
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

      // anonymous is default for not authenticated viewers
      // they only have access to free plans
      let viewer: Viewer = { id: 'anonymous', email: '' };

      const authorization = req.headers['authorization'];
      if (authorization) {
        viewer = await this.identityService.getAccount({ authorization });
        if (!viewer.id || !viewer.email) {
          sendErrors(res, ErrorDefinitions.UnauthorizedError.create());
          return;
        }
      }

      const viewerEntitledPlans = await this.plansService.getEntitledPlans({ siteId, authorization });
      const plans = viewerEntitledPlans
        .map((plan) => ({
          id: plan.access_plan?.id,
          exp: plan.access_plan?.exp,
        }))
        .filter((plan) => plan.id !== undefined && plan.exp !== undefined);

      // Generate passport tokens for the given site, viewer and plans.
      const passport = await this.passportService.generatePassport({
        siteId,
        viewerId: viewer.id,
        plans,
      });

      res.json(passport);
    } catch (error) {
      console.error('AccessController: failed to generate passport:', error);
      next(error);
    }
  }
}
