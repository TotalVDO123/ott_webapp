type Recurring = {
  // The frequency at which a subscription is billed. One of `month` or `year`.
  interval: 'month' | 'year';
  // Default number of trial days when subscribing a customer.
  trial_period_days: number | null;
};

export type Price = {
  // Unique identifier for the object.
  id: string;
  // Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase.
  currency: string;
  // The ID of the product this price is associated with.
  product: string;
  // The recurring components of a price such as `interval` and `trial`.
  recurring: Recurring | null;
  // The unit amount in cents (or local equivalent) to be charged, represented as a whole integer if possible.
  unit_amount: number | null;
};

export type Product = {
  // Unique identifier for the object.
  id: string;
  // The product's name, meant to be displayable to the customer.
  name: string;
  // The product's description, meant to be displayable to the customer.
  // Use this field to optionally store a long form explanation of the product being sold for your own rendering purposes.
  description: string;
  // The ID of the default price this product is associated with.
  default_price: string;
  // Array of price objects as defined above
  prices: Price[];
};

// General checkout parameters type. Can be extended by specific payment providers, e.g. Stripe
export type CheckoutParams = {
  price_id: string;
  success_url: string;
  cancel_url: string;
};

export type CheckoutSession = {
  url: string | null;
};
