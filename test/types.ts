export interface TestConfig {
  id: string;
  label: string;
}

export type PaymentOffer = {
  label: string;
  price: string;
  paymentFee: string;
};

export type PaymentFields = {
  cardNumber: string;
  expiryDate: string;
  securityCode: string;
};

export type ProviderProps = {
  config: TestConfig;
  monthlyOffer: PaymentOffer;
  yearlyOffer: PaymentOffer;
  paymentFields: PaymentFields;
  creditCard: string;
  creditCardNamePresent: boolean;
  applicableTax: number;
  canRenewSubscription: boolean;
  shouldMakePayment?: boolean;
  locale?: string | undefined;
  fieldWrapper?: string;
};
