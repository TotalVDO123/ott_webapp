import type { CheckoutParams } from './payment';

// Extend the CheckoutParams type with Stripe-specific fields
export type StripeCheckoutParams = CheckoutParams & {
  mode: 'payment' | 'subscription';
};
