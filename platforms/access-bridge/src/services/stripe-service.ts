import Stripe from 'stripe';
import { StripeCheckoutParams } from '@jwp/ott-common/types/stripe.js';

import { BadRequestError, ForbiddenError, UnauthorizedError } from '../errors.js';

export type StripeProduct = Stripe.Product & {
  prices: Stripe.Price[];
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
   * Retrieves Stripe products with prices and filters them based on the available access_plan_ids.
   * @param accessPlanIds The array of access plan IDs to filter the products.
   * @returns A Promise resolving to an array of filtered ProductsWithMetadata objects.
   * @throws Error if there is an issue fetching products or parsing the response.
   */
  async getStripeProductsWithPrices(accessPlanIds: string[]): Promise<StripeProduct[]> {
    try {
      const products = await this.stripe.products.list();

      // Filter products based on the access plan IDs
      const filteredProducts = products.data.filter((product) =>
        accessPlanIds.includes(product.metadata.access_plan_id)
      );

      if (filteredProducts.length === 0) {
        return [];
      }

      // Retrieve prices for each filtered product
      const productsWithPrices = await Promise.all(
        filteredProducts.map(async (product) => {
          const prices = await this.stripe.prices.list({ product: product.id });
          return {
            ...product,
            prices: prices.data,
          };
        })
      );

      return productsWithPrices;
    } catch (e) {
      // Handle specific Stripe errors
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
      console.error('Service: error fetching Stripe products:', e);
      throw e;
    }
  }

  /**
   * Creates a Stripe Checkout session based on the provided price ID.
   * @param email Email address from the auth token used for creating the checkout session.
   * @param params Stripe checkout params to use for creating the checkout session.
   * @returns A Promise resolving to a Stripe Checkout Session object, including a URL for the checkout page.
   * @throws Error if there is an issue creating the checkout session or if the price ID is invalid.
   */
  async createCheckoutSession(email: string, params: StripeCheckoutParams): Promise<Stripe.Checkout.Session> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: params.price_id,
            quantity: 1,
          },
        ],
        customer_email: email,
        mode: params.mode,
        success_url: params.redirect_url,
        cancel_url: params.redirect_url,
      });

      return session;
    } catch (e) {
      // Handle specific Stripe errors
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
      console.error('Service: error fetching Stripe products:', e);
      throw e;
    }
  }
}
