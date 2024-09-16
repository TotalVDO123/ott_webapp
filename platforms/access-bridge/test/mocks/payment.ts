import Stripe from 'stripe';
import { StripeCheckoutParams } from '@jwp/ott-common/types/stripe';

import { PaymentService } from '../../src/services/payment-service';
import { AccessBridgeError, ErrorDefinitions } from '../../src/errors';
import { STORE_PRODUCT, STRIPE_SESSION_URL } from '../fixtures';
import { Viewer } from '../../src/services/identity-service';

import { MockBehavior } from './products';

export interface MockPaymentService extends PaymentService {
  setMockBehavior(behavior: 'default' | 'empty' | 'error', error?: Stripe.errors.StripeError): unknown;
}

// Mock StripePaymentService
export class MockStripePaymentService implements MockPaymentService {
  private mockBehavior: MockBehavior = 'default';
  private mockError: AccessBridgeError | null = null;

  validateCheckoutParams(params: StripeCheckoutParams): string | null {
    const requiredParams: (keyof StripeCheckoutParams)[] = ['price_id', 'mode', 'success_url', 'cancel_url'];
    const missingParam = requiredParams.find((param) => !params[param]);
    return missingParam ? `Missing required parameter: ${missingParam}` : null;
  }

  async createCheckoutSessionUrl(viewer: Viewer, params: StripeCheckoutParams): Promise<string | null> {
    if (this.mockBehavior === 'error' && this.mockError) {
      throw this.mockError;
    }

    return STRIPE_SESSION_URL;
  }

  // Method to set the mock behavior
  setMockBehavior(behavior: 'default' | 'empty' | 'error', error?: Stripe.errors.StripeError) {
    this.mockBehavior = behavior;

    if (behavior === 'error' && error instanceof Stripe.errors.StripeError) {
      switch (error.type) {
        case 'StripeInvalidRequestError':
          this.mockError = ErrorDefinitions.BadRequestError.create();
          break;
        case 'StripeAuthenticationError':
          this.mockError = ErrorDefinitions.UnauthorizedError.create();
          break;
        case 'StripePermissionError':
          this.mockError = ErrorDefinitions.ForbiddenError.create();
          break;
        default:
          this.mockError = ErrorDefinitions.BadRequestError.create();
      }
    }
  }

  async getProductsWithPrices(productIds: string[]) {
    if (this.mockBehavior === 'error' && this.mockError) {
      throw this.mockError;
    }

    if (this.mockBehavior === 'empty') {
      return [];
    }

    return [STORE_PRODUCT];
  }
}
