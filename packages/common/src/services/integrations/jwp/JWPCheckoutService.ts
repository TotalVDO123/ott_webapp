import InPlayer, { type MerchantPaymentMethod } from '@inplayer-org/inplayer.js';
import { injectable } from 'inversify';

import type { PlanPrice } from '../../../../../../packages/common/types/jw';
import { isSVODOffer } from '../../../utils/offers';
import type {
  AccessMethod,
  CardPaymentData,
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
import type { Config } from '../../../../types/config';
import CheckoutService from '../CheckoutService';
import type { ServiceResponse } from '../../../../types/service';
import { isCommonError } from '../../../utils/api';

@injectable()
export default class JWPCheckoutService extends CheckoutService {
  private readonly cardPaymentProvider = 'stripe';
  siteId = '';

  accessMethod: AccessMethod = 'plan';

  initialize = async (config: Config) => {
    this.siteId = config.siteId;
  };

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
   * Format a (Cleeng like) offer id for the given access fee (pricing option). For JWP, we need the asset id and
   * access fee id in some cases.
   */
  private formatOfferId(offer: PlanPrice) {
    return `${offer.access.type === 'subscription' ? 'S' : 'C'}${offer.id}`; //`${offer.access.type === 'subscription' ? 'S' : 'C'}S${offer.item_id}_${offer.id}`;
  }

  private formatOffer = ({ title, planId, planOriginalId, ...offer }: PlanPrice & { title: string; planId: string; planOriginalId: number }): Offer => {
    return {
      id: offer.original_id,
      offerId: this.formatOfferId(offer),
      planId,
      planOriginalId,
      offerCurrency: offer.metadata.currency,
      customerPriceInclTax: offer.metadata.amount,
      customerCurrency: offer.metadata.currency,
      offerTitle: title,
      active: true,
      period: offer.access.period,
      freePeriods: offer.metadata.trial?.quantity ?? 0,
      planSwitchEnabled: false,
    } as Offer;
  };

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

  getAppPlans = async (plansIds: string[]) => {
    try {
      const response = await InPlayer.Payment.getSitePlans(this.siteId, plansIds);

      return response.data.plans;
    } catch {
      throw new Error('Failed to get plans');
    }
  };

  getOffers: GetOffers = async (payload) => {
    if (!payload.offerIds.length) {
      return [];
    }

    try {
      const plans = await this.getAppPlans(payload.offerIds as string[]);

      const offers = await Promise.all(
        plans.map(async (plan) => {
          try {
            const response = await InPlayer.Payment.getSitePlanPrices(this.siteId, plan.id);

            if (response.data.prices) {
              return response.data.prices.map((offer) =>
                this.formatOffer({ ...offer, planId: plan.id, planOriginalId: plan.original_id, title: plan.metadata.name }),
              );
            }

            return [];
          } catch {
            throw new Error();
          }
        }),
      );

      return offers.flat();
    } catch {
      throw new Error('Failed to get offers');
    }
  };

  getPaymentMethods: GetPaymentMethods = async () => {
    try {
      const response = await InPlayer.Payment.getPaymentMethods();
      const paymentMethods: PaymentMethod[] = [];
      response.data.forEach((method: MerchantPaymentMethod) => {
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
      const response = await InPlayer.Payment.getPayPalParams({
        origin: payload.waitingUrl,
        accessFeeId: payload.order.id,
        paymentMethod: 2,
        voucherCode: payload.couponCode,
      });

      if (response.data?.id) {
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
          redirectUrl: response.data.endpoint,
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
      const response = await InPlayer.Voucher.getDiscount({
        voucherCode: `${couponCode}`,
        accessFeeId: order.id,
      });

      const discountAmount = order.totalPrice - response.data.amount;
      const updatedOrder: Order = {
        ...order,
        totalPrice: response.data.amount,
        priceBreakdown: {
          ...order.priceBreakdown,
          discountAmount,
          discountedPrice: discountAmount,
        },
        discount: {
          applied: true,
          type: 'coupon',
          periods: response.data.discount_duration,
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
      if (isCommonError(error) && error.response.data.message === 'Voucher not found') {
        throw new Error('Invalid coupon code');
      }

      throw new Error('An unknown error occurred');
    }
  };

  getEntitlements: GetEntitlements = async ({ offerId: planId }) => {
    try {
      const response = await InPlayer.Asset.checkAccessForAsset(parseInt(planId));
      return this.formatEntitlements(response.data.expires_at, true);
    } catch {
      return this.formatEntitlements();
    }
  };

  directPostCardPayment = async (cardPaymentPayload: CardPaymentData, order: Order, referrer: string, returnUrl: string) => {
    const payload = {
      number: cardPaymentPayload.cardNumber.replace(/\s/g, ''),
      cardName: cardPaymentPayload.cardholderName,
      expMonth: cardPaymentPayload.cardExpMonth || '',
      expYear: cardPaymentPayload.cardExpYear || '',
      cvv: cardPaymentPayload.cardCVC,
      accessFee: order.id,
      paymentMethod: 1,
      voucherCode: cardPaymentPayload.couponCode,
      referrer,
      returnUrl,
    };

    try {
      if (isSVODOffer(order)) {
        await InPlayer.Subscription.createSubscription(payload);
      } else {
        await InPlayer.Payment.createPayment(payload);
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
