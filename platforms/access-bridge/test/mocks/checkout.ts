import { StripeCheckoutParams } from '@jwp/ott-common/types/stripe.js';
import Stripe from 'stripe';
import { NextFunction, Request, Response } from 'express';

import { AccessBridgeError, ErrorDefinitions, sendErrors } from '../../src/errors.js';
import { StripeService } from '../../src/services/stripe-service.js';
import { STRIPE_SESSION_URL, AUTHORIZATION, VIEWER, STRIPE_CUSTOMER_ID } from '../fixtures.js';
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

  async getCustomerIdByEmail({ email }: { email: string }): Promise<string | null> {
    return STRIPE_CUSTOMER_ID;
  }

  async createCheckoutSession({ viewer, checkoutParams }: { viewer: Viewer; checkoutParams: StripeCheckoutParams }) {
    if (this.mockBehavior === 'error' && this.mockError) {
      throw this.mockError;
    }

    return { url: STRIPE_SESSION_URL } as Stripe.Checkout.Session;
  }

  async createBillingPortalSession({
    customerId,
    returnUrl,
  }: {
    customerId: string;
    returnUrl: string;
  }): Promise<Stripe.BillingPortal.Session> {
    if (this.mockBehavior === 'error' && this.mockError) {
      throw this.mockError;
    }

    return { url: STRIPE_SESSION_URL } as Stripe.BillingPortal.Session;
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
      const requiredParams: (keyof StripeCheckoutParams)[] = ['price_id', 'mode', 'redirect_url'];
      const missingParam = requiredParams.find((param) => !checkoutParams[param]);
      if (missingParam) {
        sendErrors(res, ErrorDefinitions.ParameterMissingError.create({ parameterName: missingParam }));
        return;
      }

      const viewer = await this.identityService.getAccount({ authorization });
      const checkoutSession = await this.stripeService.createCheckoutSession({ viewer, checkoutParams });

      res.end(JSON.stringify({ url: checkoutSession.url }));
    } catch (error) {
      if (error instanceof AccessBridgeError) {
        sendErrors(res, error);
        return;
      }
      next(error);
    }
  };

  async generateBillingPortalURL(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authorization = req.headers['authorization'];
      if (!authorization) {
        sendErrors(res, ErrorDefinitions.UnauthorizedError.create());
        return;
      }

      // Get the email address from the Authorization token
      const viewer = await this.identityService.getAccount({ authorization });
      if (!viewer.id || !viewer.email) {
        sendErrors(res, ErrorDefinitions.UnauthorizedError.create());
        return;
      }

      // Retrieve Stripe customer ID using the email
      const customerId = await this.stripeService.getCustomerIdByEmail({ email: viewer.email });
      if (!customerId) {
        sendErrors(
          res,
          ErrorDefinitions.NotFoundError.create({ description: 'The requested customer does not exist in Stripe.' })
        );
        return;
      }

      const { return_url } = req.body;
      if (!return_url) {
        sendErrors(res, ErrorDefinitions.ParameterMissingError.create({ parameterName: 'return_url' }));
        return;
      }

      // Generate a billing portal session
      const session = await this.stripeService.createBillingPortalSession({ customerId, returnUrl: return_url });

      res.json({ url: session.url });
    } catch (error) {
      if (error instanceof AccessBridgeError) {
        sendErrors(res, error);
        return;
      }
      next(error);
    }
  }
}
