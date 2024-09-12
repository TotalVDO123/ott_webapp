import { Request, Response, NextFunction } from 'express';

import { PlansService } from '../services/plans-service.js';
import { StripeService } from '../services/stripe-service.js';
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
   * Service handler for fetching and returning Stripe products with prices based on available plans.
   * Retrieves and filters plans, and matches them with Stripe products via external provider IDs.
   */
  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    const availablePlans = await this.plansService.getAvailablePlans();
    const stripeProductIds: string[] = availablePlans
      .map((plan) => plan.metadata.external_providers?.stripe ?? [])
      .flat();

    const products = await this.stripeService.getProductsWithPrices(stripeProductIds);
    res.json(products);
  }
}
