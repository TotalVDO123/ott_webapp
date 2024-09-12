import { Request, Response, NextFunction } from 'express';

import { PlansService } from '../services/plans-service.js';
import { StripePaymentService } from '../services/stripe-service.js';
import { PaymentService } from '../services/payment-service.js';
/**
 * Controller class responsible for handling Stripe-related services.
 */
export class ProductsController {
  private plansService: PlansService;
  private paymentService: PaymentService;

  constructor() {
    this.plansService = new PlansService();
    this.paymentService = new StripePaymentService();
  }

  /**
   * Service handler for fetching and returning products from the used Provider with prices based on available plans.
   * Retrieves and filters SIMS plans, then matches them with the Payment products based on the external provider IDs.
   */
  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    const availablePlans = await this.plansService.getAvailablePlans();
    const stripeProductIds: string[] = availablePlans
      // At this moment we only have support for stripe
      .map((plan) => plan.metadata.external_providers?.stripe ?? [])
      .flat();

    const products = await this.paymentService.getProductsWithPrices(stripeProductIds);
    res.json(products);
  }
}
