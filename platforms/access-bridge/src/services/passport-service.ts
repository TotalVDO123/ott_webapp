import jwt from 'jsonwebtoken';
import { PassportResponse } from '@jwp/ott-common/types/passport.js';
import { AccessControlPlan } from '@jwp/ott-common/types/plans.js';

import { ACCESS_CONTROL_API_HOST, API_SECRET } from '../app-config.js';
import { handleJWError, isJWError } from '../errors.js';
import { put } from '../http.js';

type GeneratePassportParams = {
  siteId: string;
  viewerId: string;
  plans: AccessControlPlan[];
};

/**
 * PassportService handles interactions with the passport APIs.
 * It provides methods to generating access tokens (passport and refresh token).
 */
export class PassportService {
  /**
   * Generate access tokens for a specific site and subscriber.
   * @param siteId The ID of the site.
   * @param email The subscriber's email address.
   * @param plans Array of access plans for the subscriber.
   * @returns A Promise resolving to an AccessTokensResponse.
   * @throws ForbiddenError if the request is not properly authenticated.
   * @throws BadRequestError for other validation error scenarios.
   */
  async generatePassport({ siteId, viewerId, plans }: GeneratePassportParams): Promise<PassportResponse> {
    try {
      const url = await this.generateSignedUrl(`/v2/sites/${siteId}/access/generate`);
      const payload = {
        subscriber_info: {
          email: viewerId,
          plans,
        },
      };

      return await put<PassportResponse, typeof payload>(url, payload);
    } catch (e) {
      if (isJWError(e)) {
        const error = e.errors[0];
        handleJWError(error);
      }
      console.error('Service: error generating access tokens:', e);
      throw e;
    }
  }

  // URL signer - needed for validating requests on Delivery Gateway
  // More about this: https://docs.jwplayer.com/platform/reference/protect-your-content-with-signed-urls
  async generateSignedUrl(path: string, host: string = ACCESS_CONTROL_API_HOST): Promise<string> {
    try {
      const now = new Date();
      const token = jwt.sign(
        {
          // The expiration timestamp is calculated by taking the current time,
          // adding 3600 milliseconds (which is 1 second)
          // and rounding the result up to the nearest multiple of 300 milliseconds.
          // This ensures that the expiration time is always on a 300-millisecond boundary.
          exp: Math.ceil((now.getTime() + 3600) / 300) * 300,
          resource: path,
        },
        API_SECRET,
        {
          noTimestamp: true,
        }
      );

      const signedUrl = `${host}${path}?token=${token}`;
      return signedUrl;
    } catch (error) {
      console.error('Error in generateSignedUrl:', error);
      throw error;
    }
  }
}
