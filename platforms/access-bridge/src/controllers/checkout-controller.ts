import { IncomingMessage, ServerResponse } from 'http';

import { StripeCheckoutParams, StripeBillingPortalParams } from '@jwp/ott-common/types/stripe.js';

import { StripeService } from '../services/stripe-service.js';
import {
  AccessBridgeError,
  ParameterInvalidError,
  ParameterMissingError,
  sendErrors,
  UnauthorizedError,
  BadRequestError,
} from '../errors.js';
import { STRIPE_SECRET } from '../app-config.js';
import { parseJsonBody, validateBodyParams } from '../utils.js';
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
      const authorization = req.headers['authorization'];
      if (!authorization) {
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
      console.error('Controller: failed to create checkout session.', error);
      throw error;
    }
  };

  /**
   * Service handler for providing the Stripe Billing Portal URL.
   * @param req The HTTP request object.
   * @param res The HTTP response object.
   */
  generateBillingPortalURL = async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const authorization = req.headers['authorization'];
      if (!authorization) {
        sendErrors(res, new UnauthorizedError({}));
        return;
      }

      // Get the email address from the Authorization token
      const viewer = await this.accountService.getAccount({ authorization });
      if (!viewer.email) {
        sendErrors(res, new UnauthorizedError({}));
        return;
      }

      // Retrieve Stripe customer ID using the email
      const customerId = await this.stripeService.getCustomerIdByEmail(viewer.email);
      if (!customerId) {
        sendErrors(res, new ParameterInvalidError({ parameterName: 'customer_id' }));
        return;
      }

      const bodyParams = await parseJsonBody<StripeBillingPortalParams>(req);

      // Validate required params
      const requiredParams: (keyof StripeBillingPortalParams)[] = ['return_url'];
      const missingRequiredParams = validateBodyParams<StripeBillingPortalParams>(bodyParams, requiredParams);
      if (missingRequiredParams.length > 0) {
        sendErrors(res, new ParameterMissingError({ parameterName: String(missingRequiredParams[0]) }));
        return;
      }

      // Generate a billing portal session
      const sessionUrl = await this.stripeService.createBillingPortalSession(customerId, bodyParams.return_url);

      // Return the billing portal URL in the response
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ url: sessionUrl }));
    } catch (error) {
      // Ensure the error is properly typed before sending it
      if (error instanceof ParameterInvalidError || error instanceof UnauthorizedError) {
        sendErrors(res, error);
      } else {
        console.error('Controller: failed to handle billing portal request.', error);
        sendErrors(res, new BadRequestError({ description: 'An unexpected error occurred.' }));
      }
    }
  };
}
