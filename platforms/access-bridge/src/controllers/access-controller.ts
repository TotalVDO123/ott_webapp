import { IncomingMessage, ServerResponse } from 'http';

import { AccessControlPlan } from '@jwp/ott-common/types/plans.js';
import { Viewer } from '@jwp/ott-common/types/access.js';

import { ParameterInvalidError, AccessBridgeError, sendErrors, UnauthorizedError } from '../errors.js';
import { AccessService } from '../services/access-service.js';
import { PlansService } from '../services/plans-service.js';
import { isValidSiteId, parseJsonBody } from '../utils.js';
import { AccountService } from '../services/account-service.js';
import logger from '../logger.js';

/**
 * Controller class responsible for handling access-related services.
 */
export class AccessController {
  private accountService: AccountService;
  private accessService: AccessService;
  private plansService: PlansService;

  constructor() {
    this.accountService = new AccountService();
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

      // unauthorized is default for viewers without an authorization token
      let viewer: Viewer = { id: 'unauthorized', email: '' };

      const authorization = req.headers['authorization'];
      if (authorization) {
        viewer = await this.accountService.getAccount({ authorization });
        if (!viewer.id || !viewer.email) {
          sendErrors(res, new UnauthorizedError({}));
          return;
        }
      }

      const accessControlPlans = await this.plansService.getAccessControlPlans({
        siteId: params.site_id,
        endpointType: 'entitlements',
        authorization,
      });

      // map to exclude the external_providers since it's not needed in the passport data
      const plans: AccessControlPlan[] = accessControlPlans.map(({ id, exp }) => ({ id, exp }));

      // Generate access tokens for the given site, viewer and plans.
      const accessTokens = await this.accessService.generateAccessTokens({
        siteId: params.site_id,
        viewerId: viewer.id,
        plans,
      });

      res.end(JSON.stringify(accessTokens));
    } catch (error) {
      if (error instanceof AccessBridgeError) {
        sendErrors(res, error);
        return;
      }
      logger.error('Controller: failed to generate passport.', error);
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
      logger.error('Controller: failed to refresh passport.', error);
      throw error;
    }
  };
}
