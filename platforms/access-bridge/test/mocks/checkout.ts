import { StripeCheckoutParams } from '@jwp/ott-common/types/stripe.js';
import Stripe from 'stripe';
import { NextFunction, Request, Response } from 'express';

import { AccessBridgeError, ErrorDefinitions, sendErrors } from '../../src/errors.js';
import { StripeService } from '../../src/services/stripe-service.js';
import { STRIPE_SESSION_URL, AUTHORIZATION, VIEWER } from '../fixtures.js';
import { IdentityService, Viewer } from '../../src/services/identity-service.js';

// Mock IdentityService
class MockIdentityService extends IdentityService {
  async getAccount({ authorization }: { authorization: string }) {
    if (authorization === AUTHORIZATION.INVALID) {
      throw ErrorDefinitions.UnauthorizedError.create();
    }

    return VIEWER;
  }
}

// Mock StripeService
class MockStripeService extends StripeService {
  private mockBehavior: 'default' | 'error' = 'default';
  private mockError: AccessBridgeError | null = null;

  // Method to set the mock behavior
  setMockBehavior(behavior: 'default' | 'error', error?: Stripe.errors.StripeError) {
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

  async createCheckoutSession(viewer: Viewer, params: StripeCheckoutParams) {
    if (this.mockBehavior === 'error' && this.mockError) {
      throw this.mockError;
    }

    return { url: STRIPE_SESSION_URL } as Stripe.Checkout.Session;
  }
}

// Mock Controller
export class MockCheckoutController {
  private identityService: MockIdentityService;
  private stripeService: MockStripeService;

  constructor() {
    this.identityService = new MockIdentityService();
    this.stripeService = new MockStripeService();
  }

  initiateCheckout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authorization = req.headers['authorization'];
      if (!authorization) {
        sendErrors(res, ErrorDefinitions.UnauthorizedError.create());
        return;
      }

      const checkoutParams = req.body;

      // Validate required params
      const requiredParams: (keyof StripeCheckoutParams)[] = ['price_id', 'mode', 'success_url', 'cancel_url'];
      const missingParam = requiredParams.find((param) => !checkoutParams[param]);
      if (missingParam) {
        sendErrors(res, ErrorDefinitions.ParameterMissingError.create({ parameterName: missingParam }));
        return;
      }

      const viewer = await this.identityService.getAccount({ authorization });
      const checkoutSession = await this.stripeService.createCheckoutSession(viewer, checkoutParams);

      res.end(JSON.stringify({ url: checkoutSession.url }));
    } catch (error) {
      if (error instanceof AccessBridgeError) {
        sendErrors(res, error);
        return;
      }
      throw error;
    }
  };
}
