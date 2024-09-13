import { Request, Response, NextFunction } from 'express';

import { ErrorDefinitions, sendErrors } from '../errors.js';
import { IdentityService } from '../services/identity-service.js';
import { PaymentService } from '../services/payment-service.js';
import { StripePaymentService } from '../services/stripe-payment-service.js';

/**
 * Controller class responsible for handling payment checkout session URLs, where the viewers can complete the payment.
 */
export class CheckoutController {
  private readonly identityService: IdentityService;
  private readonly paymentService: PaymentService;

  constructor() {
    this.identityService = new IdentityService();
    this.paymentService = new StripePaymentService();
  }

  /**
   * Service handler for initiating a Payment Checkout session based on the provided checkout params.
   * @returns A Promise that resolves with a response containing the URL for the Payment Provider Checkout session.
   */
  async initiateCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authorization = req.headers['authorization'];
    if (!authorization) {
      sendErrors(res, ErrorDefinitions.UnauthorizedError.create());
      return;
    }

    const checkoutParams = req.body;
    const validationError = this.paymentService.validateCheckoutParams(checkoutParams);
    if (validationError) {
      sendErrors(res, ErrorDefinitions.ParameterMissingError.create({ parameterName: validationError }));
      return;
    }

    const viewer = await this.identityService.getAccount({ authorization });
    const checkoutSessionUrl = await this.paymentService.createCheckoutSessionUrl(viewer, checkoutParams);

    res.json({ url: checkoutSessionUrl });
  }
}
