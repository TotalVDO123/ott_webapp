import { AccessControlPlan, PlansResponse } from '@jwp/ott-common/types/plans.js';

import { PLANS_CLIENT } from '../app-config.js';
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError, isJWError } from '../errors.js';
import { get } from '../http.js';

export interface AccessControlPlansParams {
  siteId: string;
  endpointType: 'plans' | 'entitlements';
  authorization?: string;
}

/**
 * Service class responsible for interacting with the Plans API that handles access control plans.
 */
export class PlansService {
  private plansClient: string;

  constructor() {
    this.plansClient = PLANS_CLIENT;
  }

  /**
   * Retrieves access control plans based on the specified endpoint type.
   *
   * Depending on the `endpointType` parameter, this function either:
   * - Fetches all access control plans created by the customer (when `endpointType` is 'plans'), or
   * - Fetches access control plans that the viewer is entitled to (when `endpointType` is 'entitlements').
   *
   * If no authorization token is provided, only free plans (if any) will be considered.
   *
   * @param siteId The site ID (property ID) for which to fetch plans.
   * @param endpointType Specifies the type of endpoint to call:
   *  - 'plans': Retrieves all access control plans created by the customer.
   *  - 'entitlements': Retrieves access control plans that the viewer is entitled to.
   * @param authorization The Bearer token used to authenticate the viewer and their entitlements.
   * This parameter can be undefined if only free plans are to be fetched.
   * @returns A Promise that resolves to an array of AccessControlPlan objects.
   * @throws Error if there is an issue fetching plans or parsing the response.
   */
  async getAccessControlPlans({
    siteId,
    endpointType,
    authorization,
  }: AccessControlPlansParams): Promise<AccessControlPlan[]> {
    try {
      const plans = await get<PlansResponse>(`${this.plansClient}/v3/sites/${siteId}/${endpointType}`, authorization);
      if (!plans?.access_plan || plans.access_plan.length === 0) {
        return [];
      }

      const accessControlPlans: AccessControlPlan[] = plans.access_plan.map((plan) => ({
        id: plan.id,
        exp: plan.exp,
      }));

      return accessControlPlans;
    } catch (e) {
      // @ts-ignore
      // This will be removed once SIMS team addresses the error format for the case
      if (e.code === 401) {
        throw new UnauthorizedError({});
      }
      if (isJWError(e)) {
        const error = e.errors[0];
        // Possible error scenarios coming from SIMS
        switch (error.code) {
          case 'unauthorized':
            throw new UnauthorizedError({ description: error.description });
          case 'forbidden':
            throw new ForbiddenError({ description: error.description });
          case 'not_found':
            throw new NotFoundError({ description: error.description });
          default:
            throw new BadRequestError({ description: error.description });
        }
      }
      console.error('Service: error fetching access control plans:', e);
      throw e;
    }
  }
}
