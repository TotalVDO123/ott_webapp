import Stripe from 'stripe';

import { BadRequestError, ForbiddenError, UnauthorizedError } from '../errors.js';

export type ProductsWithMetadata = Stripe.Product & {
  metadata: {
    access_plan_id?: string;
  };
};

/**
 * Service class responsible for interacting with the Stripe API to fetch products.
 */
export class StripeService {
  private stripe: Stripe;

  constructor(stripeApiKey: string) {
    this.stripe = new Stripe(stripeApiKey, {
      apiVersion: '2024-06-20',
    });
  }

  /**
   * Retrieves Stripe products and filters them based on the available access_plan_ids.
   * @param accessPlanIds The array of access plan IDs to filter the products.
   * @returns A Promise resolving to an array of filtered ProductsWithMetadata objects.
   * @throws Error if there is an issue fetching products or parsing the response.
   */
  async getFilteredProducts(accessPlanIds: string[]): Promise<ProductsWithMetadata[]> {
    try {
      const products = await this.stripe.products.list();

      // Filter products based on the access plan IDs
      const filteredProducts = products.data.filter((product) =>
        accessPlanIds.includes(product.metadata.access_plan_id)
      );

      return filteredProducts as ProductsWithMetadata[];
    } catch (e) {
      console.error('Service: error fetching Stripe products:', e);
      // Handle specific Stripe errors if needed
      if (e instanceof Stripe.errors.StripeError) {
        switch (e.type) {
          case 'StripeInvalidRequestError':
            throw new BadRequestError({ description: e.message });
          case 'StripeAuthenticationError':
            throw new UnauthorizedError({ description: e.message });
          case 'StripePermissionError':
            throw new ForbiddenError({ description: e.message });
          default:
            throw new BadRequestError({ description: e.message });
        }
      }
      throw e;
    }
  }
}
