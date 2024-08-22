import { Request, Response, NextFunction } from 'express';

import { PlansService } from '../services/plans-service.js';
import { StripeService } from '../services/stripe-service.js';
import { AccessBridgeError, ErrorDefinitions, sendErrors } from '../errors.js';
import { isValidSiteId } from '../utils.js';

/**
 * Controller class responsible for handling Stripe-related services.
 */
export class ProductsController {
  private plansService: PlansService;
  private stripeService: StripeService;

  constructor() {
    this.plansService = new PlansService();
    this.stripeService = new StripeService();
  }

  /**
   * Service handler for fetching and filtering products based on external provider IDs.
   * @param req The HTTP request object.
   * @param res The HTTP response object.
   * @param params The request parameters containing site_id.
   */
  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    const siteId = req.params.site_id;
    if (!isValidSiteId(siteId)) {
      sendErrors(res, ErrorDefinitions.ParameterInvalidError.create({ parameterName: 'site_id' }));
      return;
    }

    try {
      const accessControlPlans = await this.plansService.getAccessControlPlans({
        siteId,
        endpointType: 'plans',
      });

      const stripeProductIds: string[] = accessControlPlans.map((plan) => plan.external_providers?.stripe ?? []).flat();
      const products = await this.stripeService.getProductsWithPrices(stripeProductIds);

      res.json(products);
    } catch (error) {
      if (error instanceof AccessBridgeError) {
        sendErrors(res, error);
        return;
      }
      console.error('Controller: failed to get Stripe products.', error);
      next(error);
    }
  }
}
