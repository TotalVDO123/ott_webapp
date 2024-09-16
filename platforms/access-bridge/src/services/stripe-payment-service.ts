import Stripe from 'stripe';
import { Product, Price } from '@jwp/ott-common/types/payment.js';

import { STRIPE_SECRET } from '../app-config.js';

import { PaymentService } from './payment-service.js';

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
   * Maps the Stripe product to our custom Product type.
   * @param product The Stripe product object.
   * @param prices The list of custom Price objects mapped from Stripe prices.
   * @returns A Product object with the required fields.
   */
  private mapProduct(product: Stripe.Product, prices: Price[]): Product {
    return {
      store_product_id: product.id,
      name: product.name,
      description: product.description ?? '',
      default_store_price_id: product.default_price as string,
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
      store_price_id: price.id,
      currencies: {
        [price.currency]: {
          amount: price.unit_amount,
        },
      },
      default_currency: price.currency,
      recurrence: price.recurring
        ? {
            interval: price.recurring.interval,
            duration: price.recurring.interval_count ?? 1,
            trial_period_interval: 'day', // Stripe only supports day for trial period.
            trial_period_duration: price.recurring.trial_period_days ?? null,
          }
        : 'one_time', // Set 'one_time' if there's no recurrence.
      billing_scheme: 'per_unit', // We only support `per_unit` scheme.
    }));
  }
}
