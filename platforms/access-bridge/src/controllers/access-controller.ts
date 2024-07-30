import { IncomingMessage, ServerResponse } from 'http';

import { AccessControlPlan } from '@jwp/ott-common/types/plans.js';

import { ParameterInvalidError, AccessBridgeError, sendErrors } from '../errors.js';
import { AccessService } from '../services/access-service.js';
import { PlansService } from '../services/plans-service.js';
import { isValidSiteId, parseAuthToken, parseJsonBody } from '../utils.js';

/**
 * Controller class responsible for handling access-related services.
 */
export class AccessController {
  private accessService: AccessService;
  private plansService: PlansService;

  constructor() {
    this.accessService = new AccessService();
    this.plansService = new PlansService();
  }

  /**
   * Service handler for generating passport access tokens.
   * @param req The HTTP request object.
   * @param res The HTTP response object.
   * @param params The request parameters containing site_id.
   */
  generatePassport = async (req: IncomingMessage, res: ServerResponse, params: { [key: string]: string }) => {
    try {
      if (!isValidSiteId(params.site_id)) {
        sendErrors(res, new ParameterInvalidError({ parameterName: 'site_id' }));
        return;
      }

      const authorization = req.headers['authorization'];
      const accessControlPlans = await this.plansService.getAccessControlPlans({
        siteId: params.site_id,
        endpointType: 'entitlements',
        authorization,
      });

      // map to exclude the external_providers since it's not needed in the passport data
      const plans: AccessControlPlan[] = accessControlPlans.map(({ id, exp }) => ({ id, exp }));

      const viewer = authorization ? parseAuthToken(authorization) : null;
      // Generate access tokens for the given site and plans.
      // If the viewer is identified from the token, use their ID.
      // Otherwise, use a default placeholder ID 'viewer'.
      const accessTokens = await this.accessService.generateAccessTokens({
        siteId: params.site_id,
        viewerId: viewer?.id.toString() ?? 'viewer',
        plans,
      });

      res.end(JSON.stringify(accessTokens));
    } catch (error) {
      if (error instanceof AccessBridgeError) {
        sendErrors(res, error);
        return;
      }
      console.error('Controller: failed to generate passport.', error);
      throw error;
    }
  };

  /**
   * Service handler for refreshing passport access tokens.
   * @param req The HTTP request object.
   * @param res The HTTP response object.
   * @param params The request parameters containing site_id.
   */
  refreshPassport = async (req: IncomingMessage, res: ServerResponse, params: { [key: string]: string }) => {
    try {
      if (!isValidSiteId(params.site_id)) {
        sendErrors(res, new ParameterInvalidError({ parameterName: 'site_id' }));
        return;
      }

      const { refresh_token: refreshToken } = await parseJsonBody<{ refresh_token: string }>(req);
      if (!refreshToken) {
        sendErrors(res, new ParameterInvalidError({ parameterName: 'refresh_token' }));
        return;
      }

      const accessTokens = await this.accessService.refreshAccessTokens({ siteId: params.site_id, refreshToken });

      res.end(JSON.stringify(accessTokens));
    } catch (error) {
      if (error instanceof AccessBridgeError) {
        sendErrors(res, error);
        return;
      }
      console.error('Controller: failed to refresh passport.', error);
      throw error;
    }
  };
}
