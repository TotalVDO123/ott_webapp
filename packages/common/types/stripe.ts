export type StripeCheckoutParams = {
  price_id: string;
  mode: 'payment' | 'setup' | 'subscription';
  redirect_url: string;
};

export type StripeCheckoutResponse = {
  url: string;
};
