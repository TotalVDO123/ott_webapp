import { IncomingMessage, ServerResponse } from 'http';

import { StripeCheckoutParams } from '@jwp/ott-common/types/stripe.js';
import Stripe from 'stripe';
import { Viewer } from '@jwp/ott-common/types/access.js';

import {
  AccessBridgeError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  sendErrors,
  ParameterInvalidError,
  ParameterMissingError,
} from '../../src/errors.js';
import { StripeService } from '../../src/services/stripe-service.js';
import { isValidSiteId, parseJsonBody, validateBodyParams } from '../../src/utils.js';
import { STRIPE_CHECKOUT_SESSION_URL, AUTHORIZATION, VIEWER } from '../fixtures.js';
import { AccountService } from '../../src/services/account-service.js';

// Mock AccountService
class MockAccountService extends AccountService {
  async getAccount({ authorization }: { authorization: string }) {
    if (authorization === AUTHORIZATION.INVALID) {
      throw new UnauthorizedError({});
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

  async createCheckoutSession(viewer: Viewer, params: StripeCheckoutParams) {
    if (this.mockBehavior === 'error' && this.mockError) {
      throw this.mockError;
    }

    return { url: STRIPE_CHECKOUT_SESSION_URL } as Stripe.Checkout.Session;
  }
}

// Mock Controller
export class MockCheckoutController {
  private accountService: MockAccountService;
  private stripeService: MockStripeService;

  constructor() {
    this.accountService = new MockAccountService();
    this.stripeService = new MockStripeService('mock-api-key');
  }

  initiateCheckout = async (req: IncomingMessage, res: ServerResponse, params: { [key: string]: string }) => {
    try {
      if (!isValidSiteId(params.site_id)) {
        sendErrors(res, new ParameterInvalidError({ parameterName: 'site_id' }));
        return;
      }

      const authorization = req.headers['authorization'];
      if (!authorization || authorization === AUTHORIZATION.INVALID) {
        sendErrors(res, new UnauthorizedError({}));
        return;
      }

      const checkoutParams = await parseJsonBody<StripeCheckoutParams>(req);

      // Validate required params
      const requiredParams: (keyof StripeCheckoutParams)[] = ['price_id', 'mode', 'redirect_url'];
      const missingRequiredParams = validateBodyParams<StripeCheckoutParams>(checkoutParams, requiredParams);
      if (missingRequiredParams.length > 0) {
        sendErrors(res, new ParameterMissingError({ parameterName: String(missingRequiredParams[0]) }));
        return;
      }

      const viewer = await this.accountService.getAccount({ authorization });
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
