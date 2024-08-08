import Stripe from 'stripe';

import { BadRequestError, ForbiddenError, UnauthorizedError } from '../errors.js';
import { MIDDLEWARE_BASE_URL } from '../app-config.js';

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
      console.error('Service: error fetching Stripe products:', e);
      throw e;
    }
  }

  /**
   * Retrieves a Stripe customer ID based on the email address.
   * @param email The email address of the customer.
   * @returns A Promise resolving to the customer ID or null if no customer is found.
   */
  async getCustomerIdByEmail(email: string): Promise<string | null> {
    try {
      const customers = await this.stripe.customers.search({
        query: `email:'${email}'`,
      });
      return customers.data.length > 0 ? customers.data[0].id : null;
    } catch (e) {
      console.error('Service: error fetching Stripe customer by email:', e);
      throw new BadRequestError({ description: 'Error retrieving customer ID' });
    }
  }

  /**
   * Creates a Stripe billing portal session for a given customer ID.
   * @param customerId The ID of the customer for whom the session is created.
   * @returns A Promise resolving to the URL of the billing portal session.
   */
  async createBillingPortalSession(customerId: string): Promise<string> {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: MIDDLEWARE_BASE_URL,
      });
      return session.url;
    } catch (e) {
      console.error('Service: error creating billing portal session:', e);
      throw new BadRequestError({ description: 'Error creating billing portal session' });
    }
  }
}
