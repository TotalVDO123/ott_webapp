import { IncomingMessage, ServerResponse } from 'http';

import { PlansService } from '../services/PlansService.js';
import { StripeService } from '../services/StripeService.js';
import {
  ParameterInvalidError,
  AccessBridgeError,
  UnauthorizedError,
  BadRequestError,
  sendErrors,
  NotFoundError,
} from '../errors.js';
import { isValidSiteId } from '../utils.js';
import { STRIPE_SECRET } from '../appConfig.js';

/**
 * Controller class responsible for handling Stripe-related services.
 */
export class StripeController {
  private plansService: PlansService;
  private stripeService: StripeService;

  constructor() {
    this.plansService = new PlansService();
    this.stripeService = new StripeService(STRIPE_SECRET);
  }

  /**
   * Service handler for fetching and filtering Stripe products based on access plan IDs.
   * @param req The HTTP request object.
   * @param res The HTTP response object.
   * @param params The request parameters containing site_id.
   */
  getFilteredProducts = async (req: IncomingMessage, res: ServerResponse, params: { [key: string]: string }) => {
    try {
      if (!isValidSiteId(params.site_id)) {
        sendErrors(res, new ParameterInvalidError({ parameterName: 'site_id' }));
        return;
      }

      // Get the authorization header
      const authorization = req.headers['authorization'];
      if (!authorization) {
        sendErrors(res, new UnauthorizedError({}));
        return;
      }

      const accessControlPlans = await this.plansService.getAccessControlPlans(params.site_id, authorization);
      console.info(accessControlPlans, ' plans'); // missing nededed data - requires SIMS team to update the API

      // mocked until data for ac plans is added
      const plans = [
        {
          id: 'PqX8Lsf9',
          exp: 1741153241,
        },
      ];
      const accessPlanIds = plans.map((plan) => plan.id);

      if (accessPlanIds.length === 0) {
        sendErrors(res, new NotFoundError({ description: 'No access plans found for the provided site_id.' }));
        return;
      }

      const filteredProducts = await this.stripeService.getFilteredProducts(accessPlanIds);
      res.end(JSON.stringify(filteredProducts));
    } catch (error) {
      if (error instanceof AccessBridgeError) {
        sendErrors(res, error);
        return;
      }
      console.error('Controller: failed to get filtered products.', error);
      sendErrors(res, new BadRequestError({ description: 'An error occurred while fetching filtered products.' }));
    }
  };
}
