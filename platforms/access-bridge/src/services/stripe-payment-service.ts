import Stripe from 'stripe';
import { Product, Price } from '@jwp/ott-common/types/payment.js';
import { StripeCheckoutParams } from '@jwp/ott-common/types/stripe.js';

import { STRIPE_SECRET } from '../app-config.js';

import { PaymentService } from './payment-service.js';
import { Viewer } from './identity-service.js';

/**
 * Service class responsible for interacting with the Stripe API to fetch products.
 */
export class StripePaymentService implements PaymentService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(STRIPE_SECRET, {
      // By specifying an API version, we ensure that our integration continues to work
      // as expected, even if new versions of the Stripe API are released.
      // If no version is specified, the Stripe client will default to the account's current API version,
      // which may lead to unexpected behavior if the account is upgraded to a newer API.
      apiVersion: '2024-06-20',
    });
  }

  /**
   * Retrieves Stripe products with prices based on the provided productIds.
   * Only products with valid prices are returned.
   * @param productIds The array of product IDs to fetch.
   * @returns A Promise resolving to an array of filtered Product objects.
   */
  async getProductsWithPrices(productIds: string[]): Promise<Product[]> {
    if (!productIds.length) {
      return [];
    }

    const productsWithPrices = await Promise.all(
      productIds.map(async (productId) => {
        try {
          const product = await this.stripe.products.retrieve(productId);
          if (!product.active) {
            // Only include active products
            return null;
          }

          const prices = await this.stripe.prices.list({ product: product.id });
          if (!prices.data.length) {
            // Only include products with prices
            return null;
          }

          const mappedPrices = this.mapPrices(prices.data);

          return this.mapProduct(product, mappedPrices);
        } catch (error) {
          console.error(`Failed to fetch product or prices for product ${productId}:`, error);
          return null; // Skip products that fail to fetch prices
        }
      })
    );

    // Filter out null products (those that failed to retrieve or have no prices)
    return productsWithPrices.filter((product) => product !== null) as Product[];
  }

  /**
   * Creates a Stripe Checkout session URL, where the viewer will be redirected to complete the payment.
   * @param viewer Email address and viewer id from the auth token used for creating the checkout session.
   * @param params Stripe checkout params to use for creating the checkout session.
   * @returns A Promise resolving to a Stripe Checkout Session URL for the checkout page.
   */
  async createCheckoutSessionUrl(viewer: Viewer, params: StripeCheckoutParams): Promise<string | null> {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
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
      success_url: params.success_url,
      cancel_url: params.cancel_url,

      // Conditionally include `subscription_data` only if mode is `subscription`
      ...(params.mode === 'subscription' && {
        subscription_data: {
          metadata: {
            viewer_id: viewer.id,
          },
        },
      }),
    };

    const checkoutSession = await this.stripe.checkout.sessions.create(sessionParams);
    return checkoutSession.url;
  }

  /**
   * Validates the provided checkout parameters.
   * Checks for the presence of required fields: 'price_id', 'mode', 'success_url', and 'cancel_url'.
   * If any required parameter is missing, returns an error message; otherwise, returns null.
   * @param params - The checkout parameters to validate.
   * @returns A string containing the name of the missing parameter if validation fails,
   * or null if all required parameters are present.
   */
  validateCheckoutParams(params: StripeCheckoutParams): string | null {
    const requiredParams: (keyof StripeCheckoutParams)[] = ['price_id', 'mode', 'success_url', 'cancel_url'];
    const missingParam = requiredParams.find((param) => !params[param]);
    return missingParam ? `Missing required parameter: ${missingParam}` : null;
  }

  /**
   * Maps the Stripe product to our custom Product type.
   * @param product The Stripe product object.
   * @param prices The list of custom Price objects mapped from Stripe prices.
   * @returns A Product object with the required fields.
   */
  private mapProduct(product: Stripe.Product, prices: Price[]): Product {
    return {
      id: product.id,
      name: product.name,
      description: product.description ?? '',
      default_price: product.default_price as string,
      prices: prices,
    };
  }

  /**
   * Maps Stripe prices to our custom Price type.
   * @param stripePrices The list of Stripe price objects.
   * @returns A list of custom Price objects.
   */
  private mapPrices(stripePrices: Stripe.Price[]): Price[] {
    return stripePrices.map((price) => ({
      id: price.id,
      currency: price.currency,
      product: price.product as string,
      unit_amount: price.unit_amount,
      recurring: price.recurring
        ? {
            interval: price.recurring.interval as 'month' | 'year',
            trial_period_days: price.recurring.trial_period_days,
          }
        : null,
    }));
  }
}
