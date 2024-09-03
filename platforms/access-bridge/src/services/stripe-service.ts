import Stripe from 'stripe';
import { StripeCheckoutParams } from '@jwp/ott-common/types/stripe.js';

import { STRIPE_SECRET } from '../app-config.js';

import { Viewer } from './identity-service.js';

export type StripeProduct = Stripe.Product & {
  prices: Stripe.Price[];
};

/**
 * Service class responsible for interacting with the Stripe API to fetch products.
 */
export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(STRIPE_SECRET, {
      apiVersion: '2024-06-20',
    });
  }

  /**
   * Retrieves a Stripe customer ID based on the email address.
   * @param email The email address of the customer.
   * @returns A Promise resolving to the customer ID or null if no customer is found.
   * @throws Error if there is an issue searching stripe customers by email.
   */
  async getCustomerIdByEmail({ email }: { email: string }): Promise<string | null> {
    // Search for customers by email using Stripe's API.
    const customers = await this.stripe.customers.search({
      query: `email:'${email}'`,
    });

    // Return the first customer's ID if available, otherwise null.
    return customers.data.length ? customers.data[0].id : null;
  }

  /**
   * Retrieves Stripe products with prices and filters them based on the provided productIds.
   * @param productIds The array of product IDs to filter the products.
   * @returns A Promise resolving to an array of filtered ProductsWithMetadata objects.
   */
  async getProductsWithPrices({ productIds }: { productIds: string[] }): Promise<StripeProduct[]> {
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
  }

  /**
   * Creates a Stripe Checkout session based on the provided price ID.
   * @param viewer Email address and viewer id from the auth token used for creating the checkout session.
   * @param params Stripe checkout params to use for creating the checkout session.
   * @returns A Promise resolving to a Stripe Checkout Session object, including a URL for the checkout page.
   */
  async createCheckoutSession({
    viewer,
    checkoutParams,
  }: {
    viewer: Viewer;
    checkoutParams: StripeCheckoutParams;
  }): Promise<Stripe.Checkout.Session> {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: checkoutParams.price_id,
          quantity: 1,
        },
      ],
      metadata: {
        viewer_id: viewer.id,
      },
      customer_email: viewer.email,
      mode: checkoutParams.mode,
      success_url: checkoutParams.success_url,
      cancel_url: checkoutParams.cancel_url,

      // Conditionally include `subscription_data` only if mode is `subscription`
      ...(checkoutParams.mode === 'subscription' && {
        subscription_data: {
          metadata: {
            viewer_id: viewer.id,
          },
        },
      }),
    };

    return await this.stripe.checkout.sessions.create(sessionParams);
  }

  /**
   * Creates a Stripe billing portal session for a given customer ID.
   * @param customerId The ID of the customer for whom the session is created.
   * @returns A Promise resolving to the URL of the billing portal session.
   */
  async createBillingPortalSession({
    customerId,
    returnUrl,
  }: {
    customerId: string;
    returnUrl: string;
  }): Promise<Stripe.BillingPortal.Session> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session;
  }
}
