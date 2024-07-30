import { AccessControlPlansParams } from '@jwp/ott-common/types/plans.js';
import Stripe from 'stripe';

import { AccessBridgeError, BadRequestError, UnauthorizedError, ForbiddenError } from '../../src/errors.js';
import { PlansService } from '../../src/services/plans-service.js';
import { StripeService } from '../../src/services/stripe-service.js';
import { PLANS, STRIPE_PRODUCT } from '../fixtures.js';

// Mock PlansService
export class MockPlansService extends PlansService {
  async getAccessControlPlans({ siteId, endpointType, authorization }: AccessControlPlansParams) {
    return PLANS.VALID;
  }
}

// Mock StripeService
export class MockStripeService extends StripeService {
  private mockBehavior: 'default' | 'empty' | 'error' = 'default';
  private mockError: AccessBridgeError | null = null;

  // Method to set the mock behavior
  setMockBehavior(behavior: 'default' | 'empty' | 'error', error?: Stripe.errors.StripeError) {
    this.mockBehavior = behavior;

    if (behavior === 'error' && error instanceof Stripe.errors.StripeError) {
      switch (error.type) {
        case 'StripeInvalidRequestError':
          this.mockError = new BadRequestError({});
          break;
        case 'StripeAuthenticationError':
          this.mockError = new UnauthorizedError({});
          break;
        case 'StripePermissionError':
          this.mockError = new ForbiddenError({});
          break;
        default:
          this.mockError = new BadRequestError({});
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

    return [STRIPE_PRODUCT];
  }
}
