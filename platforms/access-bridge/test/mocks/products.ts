import Stripe from 'stripe';
import { Plan } from '@jwp/ott-common/types/plans.js';

import { AccessBridgeError, ErrorDefinitions } from '../../src/errors.js';
import { PlansService } from '../../src/services/plans-service.js';
import { PLANS, STORE_PRODUCT } from '../fixtures.js';
import { ProductsController } from '../../src/controllers/products-controller.js';
import { PaymentService } from '../../src/services/payment-service.js';

export type MockBehavior = 'default' | 'empty' | 'error';

export interface MockPaymentService extends PaymentService {
  setMockBehavior(behavior: 'default' | 'empty' | 'error', error?: Stripe.errors.StripeError): unknown;
}

// Mock PlansService
export class MockPlansService extends PlansService {
  async getAvailablePlans(): Promise<Plan[]> {
    return PLANS.VALID;
  }
}

// Mock StripeService
export class MockStripePaymentService implements MockPaymentService {
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

    return [STORE_PRODUCT];
  }
}

export class MockProductsController extends ProductsController {
  constructor() {
    super();
    Reflect.set(this, 'paymentService', new MockStripePaymentService());
    Reflect.set(this, 'plansService', new MockPlansService());
  }
}
