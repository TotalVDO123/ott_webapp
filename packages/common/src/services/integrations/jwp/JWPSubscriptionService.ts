import { inject, injectable, named } from 'inversify';

import type {
  ChangeSubscription,
  GetActivePayment,
  GetActiveSubscription,
  GetAllTransactions,
  PaymentDetail,
  Subscription,
  UpdateCardDetails,
  UpdateSubscription,
} from '../../../../types/subscription';
import SubscriptionService from '../SubscriptionService';

import type {
  GetSubscriptionsResponse,
  GetDefaultCardResponse,
  CancelSubscriptionResponse,
  ChangeSubscriptionPlanResponse,
  SetDefaultCardResponse,
  Card,
  JWPSubscription,
  JWPSubscriptionPlanList,
} from './types';
import JWPAPIService from './JWPAPIService';

interface SubscriptionDetails extends JWPSubscription {
  item_id?: number;
  item_title?: string;
  subscription_id?: string;
  subscription_price?: number;
  action_type?: 'recurrent' | 'canceled' | 'free-trial' | 'ended' | 'incomplete_expired';
  next_rebill_date?: number;
  charged_amount?: number;
  payment_method_name?: string;
  access_type?: {
    period: string;
  };
  access_fee_id?: number;
}

@injectable()
export default class JWPSubscriptionService extends SubscriptionService {
  protected readonly apiService: JWPAPIService;

  constructor(@named('JWP') @inject(JWPAPIService) apiService: JWPAPIService) {
    super();

    this.apiService = apiService;
  }

  private formatCardDetails = (
    card: Card & {
      card_type: string;
      account_id: number;
      currency: string;
    },
  ): PaymentDetail => {
    const { number, exp_month, exp_year, card_name, card_type, account_id, currency } = card;
    const zeroFillExpMonth = `0${exp_month}`.slice(-2);

    return {
      id: 0,
      paymentMethodId: 0,
      paymentGateway: 'card',
      paymentMethod: 'card',
      customerId: account_id.toString(),
      paymentMethodSpecificParams: {
        holderName: card_name,
        variant: card_type,
        lastCardFourDigits: String(number),
        cardExpirationDate: `${zeroFillExpMonth}/${exp_year}`,
      },
      active: true,
      currency,
    } as PaymentDetail;
  };

  private formatActiveSubscription = (subscription: SubscriptionDetails, expiresAt: number) => {
    let status = '';
    switch (subscription.action_type) {
      case 'free-trial':
        status = 'active_trial';
        break;
      case 'recurrent':
        status = 'active';
        break;
      case 'canceled':
        status = 'cancelled';
        break;
      case 'incomplete_expired' || 'ended':
        status = 'expired';
        break;
      default:
        status = 'terminated';
    }

    return {
      subscriptionId: subscription.subscription_id,
      offerId: subscription.item_id?.toString(),
      accessFeeId: `S${subscription.access_fee_id}`,
      status,
      expiresAt,
      nextPaymentAt: subscription.next_rebill_date,
      nextPaymentPrice: subscription.subscription_price,
      nextPaymentCurrency: subscription.currency,
      paymentGateway: 'stripe',
      paymentMethod: subscription.payment_method_name,
      offerTitle: subscription.item_title,
      period: subscription.access_type?.period,
      totalPrice: subscription.charged_amount,
      unsubscribeUrl: subscription.unsubscribe_url,
      pendingSwitchId: null,
    } as Subscription;
  };

  getActiveSubscription: GetActiveSubscription = async () => {
    try {
      const { plans } = await this.apiService.get<JWPSubscriptionPlanList>('/v3/sites/:siteId/entitlements', {
        withAuthentication: true,
      });

      if (plans?.length) {
        const svodPlan = plans.findLast((plan) => plan.metadata.access_model === 'svod');

        if (svodPlan) {
          const { collection: subscriptions } = await this.apiService.get<GetSubscriptionsResponse>(
            '/subscriptions',
            {
              withAuthentication: true,
              contentType: 'json',
            },
            {
              limit: 15,
              page: 0,
            },
          );

          const activeSubscription = subscriptions.find((subscription: SubscriptionDetails) => subscription.item_id === svodPlan.original_id);

          if (activeSubscription) {
            return this.formatActiveSubscription(activeSubscription, svodPlan.access_plan.exp);
          }
        }
      }

      return null;
    } catch (error) {
      if (JWPAPIService.isCommonError(error) && error.response.data.code === 402) {
        return null;
      }

      throw new Error('Unable to fetch customer subscriptions.');
    }
  };

  getAllTransactions: GetAllTransactions = async () => null;

  getActivePayment: GetActivePayment = async () => {
    try {
      const data = await this.apiService.get<GetDefaultCardResponse>('/v2/payments/cards/default', {
        withAuthentication: true,
        contentType: 'json',
      });

      const cards: PaymentDetail[] = [];
      for (const currency in data?.cards) {
        cards.push(
          this.formatCardDetails({
            ...data.cards?.[currency],
            currency: currency,
          }),
        );
      }
      return cards.find((paymentDetails) => paymentDetails.active) || null;
    } catch {
      return null;
    }
  };

  getSubscriptions = async () => {
    return {
      errors: [],
      responseData: { items: [] },
    };
  };

  updateSubscription: UpdateSubscription = async ({ offerId, unsubscribeUrl }) => {
    if (!unsubscribeUrl) {
      throw new Error('Missing unsubscribe url');
    }
    try {
      await this.apiService.get<CancelSubscriptionResponse>(unsubscribeUrl, { withAuthentication: true, contentType: 'json' });
      return {
        errors: [],
        responseData: { offerId: offerId, status: 'cancelled', expiresAt: 0 },
      };
    } catch {
      throw new Error('Failed to update subscription');
    }
  };

  changeSubscription: ChangeSubscription = async ({ accessFeeId, subscriptionId }) => {
    try {
      const data = await this.apiService.post<ChangeSubscriptionPlanResponse>(
        '/v2/subscriptions/stripe:switch',
        {
          inplayer_token: subscriptionId,
          access_fee_id: accessFeeId,
        },
        {
          withAuthentication: true,
        },
      );
      return {
        errors: [],
        responseData: { message: data.message },
      };
    } catch {
      throw new Error('Failed to change subscription');
    }
  };

  updateCardDetails: UpdateCardDetails = async ({ cardName, cardNumber, cvc, expMonth, expYear, currency }) => {
    try {
      const responseData = await this.apiService.put<SetDefaultCardResponse>(
        '/v2/payments/cards/default',
        {
          number: cardNumber,
          card_name: cardName,
          cvv: cvc,
          exp_month: expMonth,
          exp_year: expYear,
          currency_iso: currency,
        },
        { withAuthentication: true },
      );

      return { errors: [], responseData };
    } catch {
      throw new Error('Failed to update card details');
    }
  };

  fetchReceipt = async ({ transactionId }: { transactionId: string }) => {
    try {
      const responseData = await this.apiService.get<Blob>(`/v2/accounting/transactions/${transactionId}/receipt`, {
        withAuthentication: true,
        contentType: 'json',
        responseType: 'blob',
      });

      return { errors: [], responseData };
    } catch {
      throw new Error('Failed to get billing receipt');
    }
  };

  getPaymentDetails = undefined;

  getTransactions = undefined;
}
