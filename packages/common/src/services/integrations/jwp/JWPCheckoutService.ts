import { inject, injectable } from 'inversify';

import { isSVODOffer } from '../../../utils/offers';
import type {
  AccessMethod,
  CardPaymentData,
  ChooseOffer,
  CreateOrder,
  CreateOrderArgs,
  GetEntitlements,
  GetEntitlementsResponse,
  GetOffers,
  GetPaymentMethods,
  Offer,
  Order,
  Payment,
  PaymentMethod,
  PaymentWithAdyen,
  PaymentWithoutDetails,
  PaymentWithPayPal,
  UpdateOrder,
} from '../../../../types/checkout';
import CheckoutService from '../CheckoutService';
import type { ServiceResponse } from '../../../../types/service';

import type {
  CommonResponse,
  MerchantPaymentMethod,
  GeneratePayPalParameters,
  VoucherDiscountPrice,
  GetItemAccessResponse,
  StripeProduct,
  StripePrice,
} from './types';
import JWPAPIService from './JWPAPIService';

@injectable()
export default class JWPCheckoutService extends CheckoutService {
  protected readonly cardPaymentProvider = 'stripe';

  accessMethod: AccessMethod = 'plan';

  protected readonly apiService;

  constructor(@inject(JWPAPIService) apiService: JWPAPIService) {
    super();
    this.apiService = apiService;
  }

  private formatPaymentMethod = (method: MerchantPaymentMethod, cardPaymentProvider: string): PaymentMethod => {
    return {
      id: method.id,
      methodName: method.method_name.toLocaleLowerCase(),
      provider: cardPaymentProvider,
      logoUrl: '',
    } as PaymentMethod;
  };

  private formatEntitlements = (expiresAt: number = 0, accessGranted: boolean = false): ServiceResponse<GetEntitlementsResponse> => {
    return {
      errors: [],
      responseData: {
        accessGranted,
        expiresAt,
      },
    };
  };

  /**
   * Parse the given offer id and extract the asset id.
   * The offer id might be the Cleeng format (`S<assetId>_<pricingOptionId>`) or the asset id as string.
   */
  private parseOfferId(offerId: string | number) {
    if (typeof offerId === 'string') {
      // offer id format `S<assetId>_<pricingOptionId>`
      if (offerId.startsWith('C') || offerId.startsWith('S')) {
        return parseInt(offerId.slice(1).split('_')[0]);
      }

      // offer id format `<assetId>`
      return parseInt(offerId);
    }

    return offerId;
  }

  private formatOrder = (payload: CreateOrderArgs): Order => {
    return {
      id: payload.offer.id,
      customerId: payload.customerId,
      offerId: payload.offer.offerId,
      totalPrice: payload.offer.customerPriceInclTax,
      priceBreakdown: {
        offerPrice: payload.offer.customerPriceInclTax,
        // @TODO is this correct?
        discountAmount: payload.offer.customerPriceInclTax,
        discountedPrice: payload.offer.customerPriceInclTax,
        paymentMethodFee: 0,
        taxValue: 0,
      },
      taxRate: 0,
      currency: payload.offer.offerCurrency || 'EUR',
      requiredPaymentDetails: true,
    } as Order;
  };

  createOrder: CreateOrder = async (payload) => {
    return {
      errors: [],
      responseData: {
        message: '',
        order: this.formatOrder(payload),
        success: true,
      },
    };
  };

  chooseOffer: ChooseOffer = async ({ offer: { contentExternalId, offerId }, successUrl, cancelUrl }) => {
    try {
      const { url } = await this.apiService.post<{ url: string }>(
        '/v2/sites/:siteId/checkout',
        {
          access_plan_id: contentExternalId,
          price_id: offerId,
          mode: 'subscription',
          success_url: successUrl,
          cancel_url: cancelUrl,
        },
        { withAuthentication: true, useAccessBridge: true, contentType: 'json' },
      );

      return url;
    } catch (error) {
      throw new Error('Failed to get checkout URL');
    }
  };

  private formatPriceToOffer = (price: StripePrice & { name: string; planId: string }, i: number): Offer =>
    ({
      id: i,
      offerId: price.id,
      offerCurrency: price.currency,
      customerPriceInclTax: price.unit_amount / 100,
      customerCurrency: price.currency,
      offerTitle: price.name,
      active: true,
      period: price.recurring.interval,
      freePeriods: price.recurring.trial_period_days ?? 0,
      planSwitchEnabled: false,
      contentExternalId: price.planId,
    } as unknown as Offer);

  getOffers: GetOffers = async () => {
    try {
      const stripeProducts = await this.apiService.get<StripeProduct[]>('/v2/sites/:siteId/products', { useAccessBridge: true });

      const offers: Offer[] = [];

      stripeProducts.forEach((product) =>
        product.prices.forEach((price) => {
          if (!price.active) {
            return;
          }

          const i = offers.length + 1;
          const offer = this.formatPriceToOffer({ ...price, name: product.name, planId: product.metadata.access_plan_id }, i);

          offers.push(offer);
        }),
      );

      return offers;
    } catch (error) {
      throw new Error('Failed to get offers');
    }
  };

  getPaymentMethods: GetPaymentMethods = async () => {
    try {
      const data = await this.apiService.get<MerchantPaymentMethod[]>('/payments/methods', { withAuthentication: true });
      const paymentMethods: PaymentMethod[] = [];
      data.forEach((method: MerchantPaymentMethod) => {
        if (['card', 'paypal'].includes(method.method_name.toLowerCase())) {
          paymentMethods.push(this.formatPaymentMethod(method, this.cardPaymentProvider));
        }
      });
      return {
        errors: [],
        responseData: {
          message: '',
          paymentMethods,
          status: 1,
        },
      };
    } catch {
      throw new Error('Failed to get payment methods');
    }
  };

  paymentWithPayPal: PaymentWithPayPal = async (payload) => {
    try {
      const data = await this.apiService.post<GeneratePayPalParameters>(
        '/external-payments',
        {
          origin: payload.waitingUrl,
          access_fee: payload.order.id,
          payment_method: 2,
          voucher_code: payload.couponCode,
        },
        { withAuthentication: true },
      );

      if (data?.id) {
        return {
          errors: ['Already have an active access'],
          responseData: {
            redirectUrl: payload.errorUrl,
          },
        };
      }
      return {
        errors: [],
        responseData: {
          redirectUrl: data.endpoint,
        },
      };
    } catch {
      throw new Error('Failed to generate PayPal payment url');
    }
  };

  iFrameCardPayment: PaymentWithAdyen = async () => {
    return {
      errors: [],
      responseData: {} as Payment,
    };
  };

  paymentWithoutDetails: PaymentWithoutDetails = async () => {
    return {
      errors: [],
      responseData: {} as Payment,
    };
  };

  updateOrder: UpdateOrder = async ({ order, couponCode }) => {
    try {
      const data = await this.apiService.post<VoucherDiscountPrice>(
        '/vouchers/discount',
        {
          voucher_code: `${couponCode}`,
          access_fee_id: order.id,
        },
        { withAuthentication: true },
      );

      const discountAmount = order.totalPrice - data.amount;
      const updatedOrder: Order = {
        ...order,
        totalPrice: data.amount,
        priceBreakdown: {
          ...order.priceBreakdown,
          discountAmount,
          discountedPrice: discountAmount,
        },
        discount: {
          applied: true,
          type: 'coupon',
          periods: data.discount_duration,
        },
      };

      return {
        errors: [],
        responseData: {
          message: 'successfully updated',
          order: updatedOrder,
          success: true,
        },
      };
    } catch (error: unknown) {
      if (JWPAPIService.isCommonError(error) && error.response.data.message === 'Voucher not found') {
        throw new Error('Invalid coupon code');
      }

      throw new Error('An unknown error occurred');
    }
  };

  getEntitlements: GetEntitlements = async ({ offerId }) => {
    try {
      const data = await this.apiService.get<GetItemAccessResponse>(`/items/${this.parseOfferId(offerId)}/access`, {
        withAuthentication: true,
      });

      return this.formatEntitlements(data.expires_at, true);
    } catch {
      return this.formatEntitlements();
    }
  };

  directPostCardPayment = async (cardPaymentPayload: CardPaymentData, order: Order, referrer: string, returnUrl: string) => {
    const payload = {
      number: cardPaymentPayload.cardNumber.replace(/\s/g, ''),
      card_name: cardPaymentPayload.cardholderName,
      exp_month: cardPaymentPayload.cardExpMonth || '',
      exp_year: cardPaymentPayload.cardExpYear || '',
      cvv: cardPaymentPayload.cardCVC,
      access_fee: order.id,
      payment_method: 1,
      voucher_code: cardPaymentPayload.couponCode,
      referrer,
      return_url: returnUrl,
    };

    try {
      if (isSVODOffer(order)) {
        await this.apiService.post<CommonResponse>('/subscriptions', payload, { withAuthentication: true });
      } else {
        await this.apiService.post<CommonResponse>('/payments', payload, { withAuthentication: true });
      }

      return true;
    } catch {
      throw new Error('Failed to make payment');
    }
  };

  getSubscriptionSwitches = undefined;

  getOrder = undefined;

  switchSubscription = undefined;

  getSubscriptionSwitch = undefined;

  createAdyenPaymentSession = undefined;

  initialAdyenPayment = undefined;

  finalizeAdyenPayment = undefined;

  updatePaymentMethodWithPayPal = undefined;

  deletePaymentMethod = undefined;

  addAdyenPaymentDetails = undefined;

  finalizeAdyenPaymentDetails = undefined;

  getOffer = undefined;
}
