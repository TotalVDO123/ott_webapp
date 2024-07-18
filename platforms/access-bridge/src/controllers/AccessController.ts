import { IncomingMessage, ServerResponse } from 'http';

import { ParameterInvalidError, PassportBridgeError, sendErrors } from '../errors.js';
import { AccessService } from '../services/AccessService.js';
import { PlansService } from '../services/PlansService.js';
import { isValidSiteId, parseJsonBody } from '../utils.js';

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
      }

      const accessControlPlans = await this.plansService.getAccessControlPlans(params.site_id);
      console.info(accessControlPlans, ' plans'); // missing nededed data - requires SIMS team to update the API

      // mocked until data for ac plans is added
      const plans = [
        {
          id: 'PqX8Lsf9',
          exp: 1741153241,
        },
      ];
      const response = await this.accessService.generateAccessTokens(params.site_id, 'test@email.com', plans);

      res.end(JSON.stringify(response));
    } catch (error) {
      if (error instanceof PassportBridgeError) {
        sendErrors(res, error);
        return;
      }
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
      }

      const { refresh_token: refreshToken } = await parseJsonBody<{ refresh_token: string }>(req);
      const response = await this.accessService.refreshAccessTokens(params.site_id, refreshToken);

      res.end(JSON.stringify(response));
    } catch (error) {
      if (error instanceof PassportBridgeError) {
        sendErrors(res, error);
        return;
      }
      throw error;
    }
  };
}
