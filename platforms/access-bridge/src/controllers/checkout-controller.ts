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
      const checkoutSession = await this.stripeService.createCheckoutSession(viewer, checkoutParams);

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
}
