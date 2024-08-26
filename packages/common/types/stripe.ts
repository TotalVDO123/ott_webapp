export type StripeCheckoutParams = {
  price_id: string;
  mode: 'payment' | 'setup' | 'subscription';
  success_url: string;
  cancel_url: string;
};

export type StripeCheckoutResponse = {
  url: string;
};

export type StripeBillingPortalParams = {
  return_url: string;
};
