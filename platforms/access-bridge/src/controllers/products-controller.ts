import { IncomingMessage, ServerResponse } from 'http';

import { PlansService } from '../services/plans-service.js';
import { StripeService } from '../services/stripe-service.js';
import { ParameterInvalidError, AccessBridgeError, sendErrors } from '../errors.js';
import { isValidSiteId } from '../utils.js';
import { STRIPE_SECRET } from '../app-config.js';

/**
 * Controller class responsible for handling Stripe-related services.
 */
export class ProductsController {
  private plansService: PlansService;
  private stripeService: StripeService;

  constructor() {
    this.plansService = new PlansService();
    this.stripeService = new StripeService(STRIPE_SECRET);
  }

  /**
   * Service handler for fetching and filtering products based on external provider IDs.
   * @param req The HTTP request object.
   * @param res The HTTP response object.
   * @param params The request parameters containing site_id.
   */
  getProducts = async (req: IncomingMessage, res: ServerResponse, params: { [key: string]: string }) => {
    try {
      if (!isValidSiteId(params.site_id)) {
        sendErrors(res, new ParameterInvalidError({ parameterName: 'site_id' }));
        return;
      }

      const accessControlPlans = await this.plansService.getAccessControlPlans({
        siteId: params.site_id,
        endpointType: 'plans',
        authorization: req.headers['authorization'],
      });

      const externalProviderIds: string[] = accessControlPlans
        .map((plan) => plan.external_providers?.stripe)
        .filter((id): id is string => id !== undefined);

      // This is just for testing purpose until SIMS API is updated to include external ids
      // Uncomment if you want to recieve real Stripe data instead of empty array
      // if (!externalProviderIds.length) {
      //   externalProviderIds = ['prod_QRUHbH7wK5HHPr'];
      // }

      const products = await this.stripeService.getProductsWithPrices(externalProviderIds);

      res.end(JSON.stringify(products));
    } catch (error) {
      if (error instanceof AccessBridgeError) {
        sendErrors(res, error);
        return;
      }
      console.error('Controller: failed to get Stripe products.', error);
      throw error;
    }
  };
}
