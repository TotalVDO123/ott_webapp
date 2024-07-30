import { IncomingMessage, ServerResponse } from 'http';

import { StripeCheckoutParams } from '@jwp/ott-common/types/stripe.js';

import { StripeService } from '../services/stripe-service.js';
import {
  AccessBridgeError,
  NotFoundError,
  ParameterInvalidError,
  ParameterMissingError,
  sendErrors,
  UnauthorizedError,
} from '../errors.js';
import { STRIPE_SECRET } from '../app-config.js';
import { isValidSiteId, parseAuthToken, parseJsonBody, validateBodyParams } from '../utils.js';
import { PlansService } from '../services/plans-service.js';

/**
 * Controller class responsible for handling Stripe Checkout sessions.
 */
export class CheckoutController {
  private stripeService: StripeService;
  private plansService: PlansService;

  constructor() {
    this.stripeService = new StripeService(STRIPE_SECRET);
    this.plansService = new PlansService();
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
      const viewer = authorization ? parseAuthToken(authorization) : null;
      if (!viewer?.id || !viewer?.email) {
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

      const accessControlPlans = await this.plansService.getAccessControlPlans({
        siteId: params.site_id,
        endpointType: 'plans',
        authorization,
      });

      const externalProductIds = accessControlPlans.map((plan) => plan.external_providers?.stripe);
      // Use the commented one if you want to test the checkout session
      // This will be removed once SIMS API is updated to include external providers
      // const externalProductIds = ['prod_QRUHbH7wK5HHPr'];
      if (!externalProductIds.length) {
        sendErrors(res, new NotFoundError({ description: 'No purchasable products are available for this customer.' }));
      }

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
