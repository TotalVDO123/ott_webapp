import type { CheckoutParams, Product } from '@jwp/ott-common/types/payment.js';

import { Viewer } from './identity-service';
/**
 * PaymentService interface defines the contract for payment service implementations.
 * Any class implementing this should handle products, prices, checkout and payment,
 * from a specific payment provider (e.g., Stripe, Google, Apple).
 */
export interface PaymentService<T extends CheckoutParams = CheckoutParams> {
  /**
   * Retrieves products with prices based on the provided product IDs.
   * The implementation should interact with the payment provider's API to fetch products and prices details.
   *
   * @param productIds - An array of product IDs to filter the products.
   * @returns A Promise that resolves to an array of products, each containing associated price details.
   */
  getProductsWithPrices(productIds: string[]): Promise<Product[]>;

  /**
   * Creates a checkout session based on the provided viewer and checkout parameters.
   * This method should be implemented by each provider's payment service.
   *
   * @param viewer The viewer making the payment (e.g., their email and ID).
   * @param params The generic checkout parameters that will be customized for each payment provider.
   * @returns A Promise resolving to a checkout session URL depending on the provider.
   */
  createCheckoutSessionUrl(viewer: Viewer, params: T): Promise<string | null>;

  /**
   * Validates the provided checkout parameters based on the specific provider's requirements.
   * @param params - The checkout parameters to validate.
   * @returns An error string if validation fails, or null if validation succeeds.
   */
  validateCheckoutParams(params: T): string | null;
}
