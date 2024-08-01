import Stripe from 'stripe';
import { StripeCheckoutParams } from '@jwp/ott-common/types/stripe.js';
import { Viewer } from '@jwp/ott-common/types/access.js';

import { BadRequestError, ForbiddenError, UnauthorizedError } from '../errors.js';
import logger from '../logger.js';

export type StripeProduct = Stripe.Product & {
  prices: Stripe.Price[];
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
   * Retrieves Stripe products with prices and filters them based on the provided productIds.
   * @param productIds The array of product IDs to filter the products.
   * @returns A Promise resolving to an array of filtered ProductsWithMetadata objects.
   * @throws Error if there is an issue fetching products or parsing the response.
   */
  async getProductsWithPrices(productIds: string[]): Promise<StripeProduct[]> {
    try {
      if (!productIds.length) {
        return [];
      }

      // Fetch all products (pagination might be necessary for large datasets)
      const allProducts = await this.stripe.products.list();
      const filteredProducts = allProducts.data.filter((product) => productIds.includes(product.id));

      if (filteredProducts.length === 0) {
        return [];
      }

      // Retrieve prices for each filtered product
      const productsWithPrices = await Promise.all(
        filteredProducts.map(async (product) => {
          try {
            const prices = await this.stripe.prices.list({ product: product.id });
            return {
              ...product,
              prices: prices.data,
            };
          } catch (priceError) {
            console.error(`Failed to fetch prices for product ${product.id}:`, priceError);
            return {
              ...product,
              prices: [], // Return an empty array if price retrieval fails
            };
          }
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
      logger.error('Service: error fetching Stripe products:', e);
      throw e;
    }
  }

  /**
   * Creates a Stripe Checkout session based on the provided price ID.
   * @param viewer Email address and viewer id from the auth token used for creating the checkout session.
   * @param params Stripe checkout params to use for creating the checkout session.
   * @returns A Promise resolving to a Stripe Checkout Session object, including a URL for the checkout page.
   * @throws Error if there is an issue creating the checkout session or if the price ID is invalid.
   */
  async createCheckoutSession(viewer: Viewer, params: StripeCheckoutParams): Promise<Stripe.Checkout.Session> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: params.price_id,
            quantity: 1,
          },
        ],
        metadata: {
          viewer_id: viewer.id,
        },
        customer_email: viewer.email,
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
      logger.error('Service: error fetching Stripe products:', e);
      throw e;
    }
  }
}
