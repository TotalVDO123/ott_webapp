import { inject, injectable } from 'inversify';

import { API_ACCESS_BRIDGE_URL, INTEGRATION_TYPE } from '../modules/types';
import type { IntegrationType } from '../../types/config';
import type { Product } from '../../types/payment';
import { logError } from '../logger';
import { getNamedModule } from '../modules/container';

import AccountService from './integrations/AccountService';

@injectable()
export default class PaymentService {
  private readonly apiAccessBridgeUrl;
  private readonly accountService;

  private siteId: string = '';

  constructor(@inject(API_ACCESS_BRIDGE_URL) apiAccessBridgeUrl: string, @inject(INTEGRATION_TYPE) integrationType: IntegrationType) {
    this.apiAccessBridgeUrl = apiAccessBridgeUrl;
    this.accountService = getNamedModule(AccountService, integrationType);
  }

  initialize = async (siteId: string) => {
    this.siteId = siteId;
  };

  getProducts = async (): Promise<Product[]> => {
    const url = `${this.apiAccessBridgeUrl}/v2/sites/${this.siteId}/products`;
    const response = await fetch(url);

    if (!response.ok) {
      logError('PaymentService', 'Failed to fetch products.', {
        status: response.status,
        error: response.json(),
      });

      return [];
    }

    return (await response.json()) as Product[];
  };

  generateCheckoutSessionUrl = async (priceId: string, successUrl: string, cancelUrl: string): Promise<{ url: string | null }> => {
    const auth = await this.accountService.getAuthData();

    const url = `${this.apiAccessBridgeUrl}/v2/sites/${this.siteId}/checkout`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth?.jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_id: priceId,
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
    });

    if (!response.ok) {
      logError('PaymentService', `Failed to generate checkout URL. Status: ${response.status}`);
      return { url: null };
    }

    return (await response.json()) as { url: string };
  };

  generateBillingPortalUrl = async (returnUrl: string): Promise<{ url: string | null }> => {
    const auth = await this.accountService.getAuthData();

    const url = `${this.apiAccessBridgeUrl}/v2/sites/${this.siteId}/billing-portal`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth?.jwt}`,
      },
      body: JSON.stringify({
        return_url: returnUrl,
      }),
    });

    if (!response.ok) {
      logError('PaymentService', 'Failed to generate billing portal url.', {
        status: response.status,
        error: response.json(),
      });

      return { url: null };
    }

    return (await response.json()) as { url: string };
  };
}
