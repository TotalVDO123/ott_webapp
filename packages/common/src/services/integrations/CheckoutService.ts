import type {
  AccessMethod,
  AddAdyenPaymentDetails,
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
} from '../../../types/checkout';
import type { Config } from '../../../types/config';

export default abstract class CheckoutService {
  abstract initialize: (config: Config) => Promise<void>;

  abstract accessMethod: AccessMethod;

  abstract getOffers: GetOffers;

  abstract createOrder: CreateOrder;

  abstract updateOrder: UpdateOrder;

  abstract getPaymentMethods: GetPaymentMethods;

  abstract paymentWithoutDetails: PaymentWithoutDetails;

  abstract paymentWithPayPal: PaymentWithPayPal;

  abstract getEntitlements: GetEntitlements;

  abstract directPostCardPayment: GetDirectPostCardPayment;

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
}
