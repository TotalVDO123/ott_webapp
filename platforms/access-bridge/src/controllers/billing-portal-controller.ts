import { IncomingMessage, ServerResponse } from 'http';

import { StripeService } from '../services/stripe-service.js';
import { AccountService } from '../services/account-service.js';
import { BadRequestError, ParameterInvalidError, UnauthorizedError, sendErrors } from '../errors.js';
import { STRIPE_SECRET } from '../app-config.js';

/**
 * Controller class responsible for handling Stripe Billing Portal.
 */
export class BillingPortalController {
  private stripeService: StripeService;
  private accountService: AccountService;

  constructor() {
    this.stripeService = new StripeService(STRIPE_SECRET);
    this.accountService = new AccountService();
  }

  /**
   * Service handler for redirecting to the Stripe Billing Portal.
   * @param req The HTTP request object.
   * @param res The HTTP response object.
   * @param params The request parameters containing site_id.
   */
  billingPortal = async (req: IncomingMessage, res: ServerResponse, params: { [key: string]: string }) => {
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

      // Generate a billing portal session
      const sessionUrl = await this.stripeService.createBillingPortalSession(customerId);

      // Redirect to the Stripe Billing Portal
      res.writeHead(302, { Location: sessionUrl });
      res.end();
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
