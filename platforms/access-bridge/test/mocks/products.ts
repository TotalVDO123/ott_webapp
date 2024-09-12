import Stripe from 'stripe';
import { Plan } from '@jwp/ott-common/types/plans.js';

import { AccessBridgeError, ErrorDefinitions } from '../../src/errors.js';
import { PlansService } from '../../src/services/plans-service.js';
import { StripeService } from '../../src/services/stripe-service.js';
import { PLANS, STRIPE_PRODUCT } from '../fixtures.js';

export type MockBehavior = 'default' | 'empty' | 'error';

// Mock PlansService
export class MockPlansService extends PlansService {
  async getAvailablePlans(): Promise<Plan[]> {
    return PLANS.VALID;
  }
}

// Mock StripeService
export class MockStripeService extends StripeService {
  private mockBehavior: MockBehavior = 'default';
  private mockError: AccessBridgeError | null = null;

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

    return [STRIPE_PRODUCT];
  }
}
