import { IncomingMessage, ServerResponse } from 'http';

import { StripeCheckoutParams } from '@jwp/ott-common/types/stripe.js';

import { StripeService } from '../services/stripe-service.js';
import { AccessBridgeError, ParameterInvalidError, ParameterMissingError, sendErrors } from '../errors.js';
import { STRIPE_SECRET } from '../app-config.js';
import { isValidSiteId, parseJsonBody } from '../utils.js';
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

      const {
        access_plan_id: accessPlanId,
        price_id: priceId,
        redirect_url: redirectUrl,
      } = await parseJsonBody<StripeCheckoutParams>(req);

      if (!accessPlanId) {
        sendErrors(res, new ParameterMissingError({ parameterName: 'access_plan_id' }));
        return;
      }

      if (!priceId) {
        sendErrors(res, new ParameterMissingError({ parameterName: 'price_id' }));
        return;
      }

      if (!redirectUrl) {
        sendErrors(res, new ParameterMissingError({ parameterName: 'redirect_url' }));
        return;
      }

      const accessControlPlans = await this.plansService.getAccessControlPlans({
        siteId: params.site_id,
        endpointType: 'plans',
        authorization: req.headers['authorization'],
      });

      console.info(accessControlPlans, ' plans'); // Missing nededed data - requires SIMS team to update the API

      // Mocked until data for ac plans is added
      const plans = [
        {
          id: 'PqX8Lsf9',
          exp: 1741153241,
        },
      ];

      // Validate that the provided access_plan_id exists in customer's plans.
      const accessPlanIds = plans.map((plan) => plan.id);
      if (!accessPlanIds.includes(accessPlanId)) {
        sendErrors(res, new ParameterInvalidError({ parameterName: 'access_plan_id' }));
        return;
      }

      const session = await this.stripeService.createCheckoutSession({ priceId, redirectUrl });

      res.end(JSON.stringify({ url: session.url }));
    } catch (error) {
      if (error instanceof AccessBridgeError) {
        sendErrors(res, error);
        return;
      }
      console.error('Controller: failed to get Stripe products.', error);
      throw error;
    }
  };
}
