import { Request, Response, NextFunction } from 'express';

import { PlansService } from '../services/plans-service.js';
import { StripeService } from '../services/stripe-service.js';
import { ErrorDefinitions, sendErrors } from '../errors.js';
import { isValidSiteId } from '../utils.js';
import logger from '../logger.js';

/**
 * Controller class responsible for handling AC plans and Stripe products.
 */
export class ProductsController {
  private plansService: PlansService;
  private stripeService: StripeService;

  constructor() {
    this.plansService = new PlansService();
    this.stripeService = new StripeService();
  }

  /**
   * Service handler for fetching and returning Stripe products with prices based on available plans
   * for a given site ID. Validates the site ID, retrieves and filters plans, and matches them with
   * Stripe products via external provider IDs. Sends appropriate error responses for invalid requests.
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next middleware function
   */
  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    const siteId = req.params.site_id;
    if (!isValidSiteId(siteId)) {
      sendErrors(res, ErrorDefinitions.ParameterInvalidError.create({ parameterName: 'site_id' }));
      return;
    }

    try {
      const availablePlans = await this.plansService.getAvailablePlans({ siteId });
      const stripeProductIds: string[] = availablePlans
        .map((plan) => plan.metadata.external_providers?.stripe ?? [])
        .flat();

      const products = await this.stripeService.getProductsWithPrices({ productIds: stripeProductIds });
      res.json(products);
    } catch (error) {
      logger.error('ProductsController: getProducts: failed to fetch products.', error);
      next(error);
    }
  }
}
