export type StripeCheckoutParams = {
  access_plan_id: string;
  price_id: string;
  redirect_url: string;
};

export type StripeCheckoutResponse = {
  url: string;
};
