import { IncomingMessage, ServerResponse } from 'http';

import { AccessControlPlansParams } from '@jwp/ott-common/types/plans.js';
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
} from '../../../src/errors.js';
import { PlansService } from '../../../src/services/plans-service.js';
import { StripeService } from '../../../src/services/stripe-service.js';
import { isValidSiteId, parseBearerToken, parseJsonBody, validateBodyParams } from '../../../src/utils.js';
import { PLANS, STRIPE_CHECKOUT_SESSION_URL, SITE_ID, AUTHORIZATION } from '../../fixtures.js';

// Mock PlansService
class MockPlansService extends PlansService {
  async getAccessControlPlans({ siteId, endpointType, authorization }: AccessControlPlansParams) {
    return PLANS.VALID;
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
  private stripeService: MockStripeService;
  private plansService: MockPlansService;

  constructor() {
    this.stripeService = new MockStripeService('mock-api-key');
    this.plansService = new MockPlansService();
  }

  initiateCheckout = async (req: IncomingMessage, res: ServerResponse, params: { [key: string]: string }) => {
    if (!isValidSiteId(params.site_id)) {
      sendErrors(res, new ParameterInvalidError({ parameterName: 'site_id' }));
      return;
    }

    const authorization = req.headers['authorization'];
    const viewer =
      authorization === AUTHORIZATION.VALID
        ? { id: 12345, email: 'dummy@email.com' }
        : parseBearerToken(AUTHORIZATION.INVALID);
    if (!viewer?.id || !viewer?.email) {
      sendErrors(res, new UnauthorizedError({}));
      return;
    }

    const checkoutParams = await parseJsonBody<StripeCheckoutParams>(req);
    // Validate required params
    const requiredParams: (keyof StripeCheckoutParams)[] = ['access_plan_id', 'price_id', 'mode', 'redirect_url'];
    const missingRequiredParams = validateBodyParams<StripeCheckoutParams>(checkoutParams, requiredParams);
    if (missingRequiredParams.length > 0) {
      sendErrors(res, new ParameterMissingError({ parameterName: String(missingRequiredParams[0]) }));
      return;
    }

    try {
      const accessControlPlans = await this.plansService.getAccessControlPlans({
        siteId: SITE_ID.VALID,
        endpointType: 'plans',
        authorization,
      });

      const accessPlanIds = accessControlPlans.map((plan) => plan.id);
      if (!accessPlanIds.includes(checkoutParams.access_plan_id)) {
        sendErrors(res, new ParameterInvalidError({ parameterName: 'access_plan_id' }));
        return;
      }

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
