import type { Product } from '@jwp/ott-common/types/payment.js';
/**
 * PaymentService interface defines the contract for payment service implementations. *
 * Any class implementing this should handle products and prices from a specific payment provider (e.g., Stripe).
 */
export interface PaymentService {
  /**
   * Retrieves products with prices based on the provided product IDs.
   * The implementation should interact with the payment provider's API to fetch products and prices details.
   *
   * @param productIds - An array of product IDs to match and filter the provider's store products.
   * @returns A Promise that resolves to an array of products, each containing associated price details.
   */
  getProductsWithPrices(productIds: string[]): Promise<Product[]>;
}
