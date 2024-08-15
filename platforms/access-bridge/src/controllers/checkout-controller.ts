import { IncomingMessage, ServerResponse } from 'http';

import { StripeCheckoutParams } from '@jwp/ott-common/types/stripe.js';

import { StripeService } from '../services/stripe-service.js';
import {
  AccessBridgeError,
  ParameterInvalidError,
  ParameterMissingError,
  sendErrors,
  UnauthorizedError,
} from '../errors.js';
import { STRIPE_SECRET } from '../app-config.js';
import { isValidSiteId, parseJsonBody, validateBodyParams } from '../utils.js';
import { AccountService } from '../services/account-service.js';

/**
 * Controller class responsible for handling Stripe Checkout sessions.
 */
export class CheckoutController {
  private accountService: AccountService;
  private stripeService: StripeService;

  constructor() {
    this.accountService = new AccountService();
    this.stripeService = new StripeService(STRIPE_SECRET);
  }

  /**
   * Service handler for initiating a Stripe Checkout session based on the provided price ID and redirect URL.
   * @param req The HTTP request object containing the price ID and redirect URL in the request body.
   * @param res The HTTP response object used to send the checkout session URL or error messages.
   * @throws ParameterInvalidError if the price ID or redirect URL is missing or invalid.
   * @returns A Promise that resolves with a response containing the URL for the Stripe Checkout session.
   */
  initiateCheckout = async (req: IncomingMessage, res: ServerResponse, params: { [key: string]: string }) => {
    try {
      if (!isValidSiteId(params.site_id)) {
        sendErrors(res, new ParameterInvalidError({ parameterName: 'site_id' }));
        return;
      }

      const authorization = req.headers['authorization'];
      if (!authorization) {
        sendErrors(res, new UnauthorizedError({}));
        return;
      }

      const checkoutParams = await parseJsonBody<StripeCheckoutParams>(req);

      // Validate required params
      const requiredParams: (keyof StripeCheckoutParams)[] = ['price_id', 'mode', 'success_url', 'cancel_url'];
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
      console.error('Controller: failed to create checkout session.', error);
      throw error;
    }
  };
}
