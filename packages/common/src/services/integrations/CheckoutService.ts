import type {
  AccessMethod,
  AddAdyenPaymentDetails,
  ChooseOffer,
  CreateOrder,
  DeletePaymentMethod,
  FinalizeAdyenPaymentDetails,
  GetAdyenPaymentSession,
  GetDirectPostCardPayment,
  GetEntitlements,
  GetFinalizeAdyenPayment,
  GetInitialAdyenPayment,
  GetOffer,
  GetOffers,
  GetOrder,
  GetPaymentMethods,
  GetSubscriptionSwitch,
  GetSubscriptionSwitches,
  PaymentWithoutDetails,
  PaymentWithPayPal,
  SwitchSubscription,
  UpdateOrder,
  UpdatePaymentWithPayPal,
  GenerateBillingPortalURL,
} from '../../../types/checkout';

export default abstract class CheckoutService {
  abstract accessMethod: AccessMethod;

  abstract getOffers: GetOffers;

  abstract createOrder: CreateOrder;

  abstract updateOrder: UpdateOrder;

  abstract getPaymentMethods: GetPaymentMethods;

  abstract paymentWithoutDetails: PaymentWithoutDetails;

  abstract paymentWithPayPal: PaymentWithPayPal;

  abstract getEntitlements: GetEntitlements;

  abstract directPostCardPayment: GetDirectPostCardPayment;

  abstract chooseOffer: ChooseOffer;

  abstract getOffer?: GetOffer;

  abstract getOrder?: GetOrder;

  abstract switchSubscription?: SwitchSubscription;

  abstract getSubscriptionSwitches?: GetSubscriptionSwitches;

  abstract getSubscriptionSwitch?: GetSubscriptionSwitch;

  abstract createAdyenPaymentSession?: GetAdyenPaymentSession;

  abstract initialAdyenPayment?: GetInitialAdyenPayment;

  abstract finalizeAdyenPayment?: GetFinalizeAdyenPayment;

  abstract updatePaymentMethodWithPayPal?: UpdatePaymentWithPayPal;

  abstract deletePaymentMethod?: DeletePaymentMethod;

  abstract addAdyenPaymentDetails?: AddAdyenPaymentDetails;

  abstract finalizeAdyenPaymentDetails?: FinalizeAdyenPaymentDetails;

  abstract generateBillingPortalUrl?: GenerateBillingPortalURL;
}
