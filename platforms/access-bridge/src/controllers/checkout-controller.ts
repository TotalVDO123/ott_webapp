import { StripeCheckoutParams } from '@jwp/ott-common/types/stripe.js';
import { Request, Response, NextFunction } from 'express';

import { StripeService } from '../services/stripe-service.js';
import { AccessBridgeError, ErrorDefinitions, sendErrors } from '../errors.js';
import { IdentityService } from '../services/identity-service.js';
import logger from '../logger.js';

/**
 * Controller class responsible for handling Stripe Checkout sessions.
 */
export class CheckoutController {
  private identityService: IdentityService;
  private stripeService: StripeService;

  constructor() {
    this.identityService = new IdentityService();
    this.stripeService = new StripeService();
  }

  /**
   * Service handler for initiating a Stripe Checkout session based on the provided price, mode and redirect URL.
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next middleware function
   * @returns A Promise that resolves with a response containing the URL for the Stripe Checkout session.
   */
  async initiateCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      res.json({ url: checkoutSession.url });
    } catch (error) {
      if (error instanceof AccessBridgeError) {
        sendErrors(res, error);
        return;
      }
      logger.error('CheckoutController: initiateCheckout: failed to create checkout session:', error);
      next(error);
    }
  }

  /**
   * Service handler for generating a Stripe Billing portal session based on the customer.
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next middleware function
   * @returns A Promise that resolves with a response containing the URL for the Stripe Billing Portal session.
   */
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
      logger.error('CheckoutController: generateBillingPortalURL: failed to generate billing portal session:', error);
      next(error);
    }
  }
}
