import type { Product } from '@jwp/ott-common/types/payment.js';
/**
 * PaymentService interface defines the contract for payment service implementations.
 * It provides a method to retrieve products with their associated prices based on provided product IDs.
 *
 * Any class implementing this should handle products and prices from a specific payment provider (e.g., Stripe).
 */
export interface PaymentService {
  /**
   * Retrieves products with prices based on the provided product IDs.
   * The implementation should interact with the payment provider's API to fetch product details.
   *
   * @param productIds - An array of product IDs to filter the products.
   * @returns A Promise that resolves to an array of products, each containing associated price details.
   */
  getProductsWithPrices(productIds: string[]): Promise<Product[]>;
}
