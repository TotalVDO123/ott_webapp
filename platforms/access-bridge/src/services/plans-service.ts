import { AccessControlPlan, AccessControlPlansParams, PlansResponse } from '@jwp/ott-common/types/plans.js';

import { SIMS_API_HOST } from '../app-config.js';
import { ErrorDefinitions, handleJWError, isJWError } from '../errors.js';
import { get } from '../http.js';

/**
 * Service class responsible for interacting with the Plans API that handles access control plans.
 */
export class PlansService {
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
      const response = await get<PlansResponse>(`${SIMS_API_HOST}/v3/sites/${siteId}/${endpointType}`, authorization);

      if (!response?.plans) {
        return [];
      }

      const accessControlPlans: AccessControlPlan[] = response.plans
        .map((plan) => {
          const id = plan?.access_plan?.id;
          const exp = plan?.access_plan?.exp;

          if (!id || !exp) {
            return null;
          }

          return {
            id,
            exp,
            external_providers: {
              stripe: plan.metadata?.external_providers?.stripe,
              google: plan.metadata?.external_providers?.google,
              apple: plan.metadata?.external_providers?.apple,
            },
          };
        })
        .filter(Boolean) as AccessControlPlan[]; // Filter out null values

      return accessControlPlans;
    } catch (e) {
      // @ts-ignore
      // This will be removed once SIMS team addresses the error format for the case
      if (e.code === 401) {
        throw ErrorDefinitions.UnauthorizedError.create();
      }
      if (isJWError(e)) {
        const error = e.errors[0];
        handleJWError(error);
      }
      console.error('Service: error fetching access control plans:', e);
      throw e;
    }
  }
}
