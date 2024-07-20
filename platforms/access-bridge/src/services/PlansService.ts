import { PLANS_CLIENT } from '../appConfig.js';
import { BadRequestError, ForbiddenError, NotFoundError, isJWError } from '../errors.js';

export type AccessControlPlan = {
  id: string;
  exp: number;
};

type PlansResponse = {
  name: string;
  access_model: 'free' | 'freeauth' | 'svod';
  access_plan: AccessControlPlan[];
};

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
   * @returns A Promise resolving to an array of AccessControlPlan objects.
   * @throws Error if there is an issue fetching plans or parsing the response.
   */
  async getAccessControlPlans(siteId: string): Promise<AccessControlPlan[]> {
    try {
      const response = await fetch(`${this.plansClient}/v3/sites/${siteId}/entitlements`);

      if (!response.ok) {
        throw new Error(`Error fetching plans: ${response.statusText}`);
      }

      const result: PlansResponse = await response.json();
      if (!result?.access_plan || result.access_plan.length === 0) {
        return [];
      }

      const accessControlPlans: AccessControlPlan[] = result.access_plan.map((plan) => ({
        id: plan.id,
        exp: plan.exp,
      }));

      return accessControlPlans;
    } catch (e) {
      if (isJWError(e)) {
        const error = e.errors[0];
        // Possible error scenarios coming from SIMS
        switch (error.code) {
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
