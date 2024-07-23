import { AccessControlPlan, PlansResponse } from '@jwp/ott-common/types/plans.js';

import { PLANS_CLIENT } from '../appConfig.js';
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError, isJWError } from '../errors.js';
import { get } from '../http.js';

/**
 * Service class responsible for interacting with the Plans API that handles access control plans.
 */
export class PlansService {
  private plansClient: string;

  constructor() {
    this.plansClient = PLANS_CLIENT;
  }

  /**
   * Retrieves access control plans for a specific site ID.
   * @param siteId The site id (property id) for which to fetch plans.
   * @param authorization The Bearer token used to authenticate the request.
   * @returns A Promise resolving to an array of AccessControlPlan objects.
   * @throws Error if there is an issue fetching plans or parsing the response.
   */
  async getAccessControlPlans(siteId: string, authorization: string): Promise<AccessControlPlan[]> {
    try {
      const plans = await get<PlansResponse>(`${this.plansClient}/v3/sites/${siteId}/entitlements`, authorization);
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
      if (e.message.includes('signature is invalid')) {
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
