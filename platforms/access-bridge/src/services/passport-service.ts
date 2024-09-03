import jwt from 'jsonwebtoken';
import { PassportResponse } from '@jwp/ott-common/types/passport.js';
import { AccessControlPlan } from '@jwp/ott-common/types/plans.js';

import { ACCESS_CONTROL_API_HOST, API_SECRET } from '../app-config.js';
import { put } from '../http.js';

type GeneratePassportParams = {
  siteId: string;
  viewerId: string;
  plans: AccessControlPlan[];
};

type RefreshPassportParams = {
  siteId: string;
  refreshToken: string;
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
   */
  async generatePassport({ siteId, viewerId, plans }: GeneratePassportParams): Promise<PassportResponse> {
    const url = await this.generateSignedUrl(`/v2/sites/${siteId}/access/generate`);
    const payload = {
      subscriber_info: {
        email: viewerId,
        plans,
      },
    };

    return await put<PassportResponse, typeof payload>(url, payload);
  }

  /**
   * Refresh access tokens for a specific site using a refresh token.
   * @param siteId The ID of the site.
   * @param refreshToken The refresh token to use for token refresh.
   * @returns A Promise resolving to an AccessTokensResponse.
   */
  async refreshPassport({ siteId, refreshToken }: RefreshPassportParams): Promise<PassportResponse> {
    const url = await this.generateSignedUrl(`/v2/sites/${siteId}/access/refresh`);
    const payload = {
      refresh_token: refreshToken,
    };

    return await put<PassportResponse, typeof payload>(url, payload);
  }

  // URL signer - needed for validating requests on Delivery Gateway
  // More about this: https://docs.jwplayer.com/platform/reference/protect-your-content-with-signed-urls
  async generateSignedUrl(path: string, host: string = ACCESS_CONTROL_API_HOST): Promise<string> {
    const now = new Date();
    const token = jwt.sign(
      {
        // Sets expiration 3.6 seconds from now, rounded up to align with the next 300 ms interval for consistency.
        exp: Math.ceil((now.getTime() + 3600) / 300) * 300,
        resource: path,
      },
      API_SECRET,
      {
        noTimestamp: true,
      }
    );

    return `${host}${path}?token=${token}`;
  }
}
