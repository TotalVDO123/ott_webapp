import jwt from 'jsonwebtoken';
import { AccessTokensResponse } from '@jwp/ott-common/types/access.js';
import { AccessControlPlan } from '@jwp/ott-common/types/plans.js';

import { ACCESS_CONTROL_CLIENT, API_SECRET } from '../appConfig.js';
import { BadRequestError, ForbiddenError, NotFoundError, ParameterInvalidError, isJWError } from '../errors.js';
import { put } from '../http.js';

/**
 * AccessService handles interactions with the access management APIs.
 * It provides methods to generate and refresh access tokens.
 */
export class AccessService {
  private apiSecret: string;
  private accessControlClient: string;

  constructor() {
    this.apiSecret = API_SECRET;
    this.accessControlClient = ACCESS_CONTROL_CLIENT;
  }

  /**
   * Generate access tokens for a specific site and subscriber.
   * @param siteId The ID of the site.
   * @param email The subscriber's email address.
   * @param plans Array of access plans for the subscriber.
   * @returns A Promise resolving to an AccessTokensResponse.
   * @throws ForbiddenError if the request is not properly authenticated.
   * @throws BadRequestError for other validation error scenarios.
   */
  async generateAccessTokens(siteId: string, email: string, plans: AccessControlPlan[]): Promise<AccessTokensResponse> {
    try {
      const url = await this.generateSignedUrl(`/v2/sites/${siteId}/access/generate`);
      const payload = {
        subscriber_info: {
          email,
          plans,
        },
      };

      return await put<AccessTokensResponse, typeof payload>(url, payload);
    } catch (e) {
      if (isJWError(e)) {
        const error = e.errors[0];
        // Possible error scenarios coming from Delivery Gateway
        switch (error.code) {
          case 'forbidden':
            throw new ForbiddenError({ description: error.description });
          default:
            throw new BadRequestError({ description: error.description });
        }
      }
      console.error('Service: error generating access tokens:', e);
      throw e;
    }
  }

  /**
   * Refresh access tokens for a specific site using a refresh token.
   * @param siteId The ID of the site.
   * @param refreshToken The refresh token to use for token refresh.
   * @returns A Promise resolving to an AccessTokensResponse.
   * @throws ForbiddenError if the request is not properly authenticated.
   * @throws ParameterInvalidError if the refresh token is missing or invalid.
   * @throws NotFoundError if the requested resource is not found.
   * @throws BadRequestError for other validation error scenarios.
   */
  async refreshAccessTokens(siteId: string, refreshToken: string): Promise<AccessTokensResponse> {
    try {
      const url = await this.generateSignedUrl(`/v2/sites/${siteId}/access/refresh`);
      const payload = {
        refresh_token: refreshToken,
      };

      return await put<AccessTokensResponse, typeof payload>(url, payload);
    } catch (e) {
      if (isJWError(e)) {
        const error = e.errors[0];
        // Possible error scenarios coming from Delivery Gateway
        switch (error.code) {
          case 'forbidden':
            throw new ForbiddenError({ description: error.description });
          case 'parameter_missing':
            throw new ParameterInvalidError({ parameterName: 'refresh_token', reason: error.description });
          case 'parameter_invalid':
            throw new ParameterInvalidError({ parameterName: 'refresh_token', reason: error.description });
          case 'not_found':
            throw new NotFoundError({ description: error.description });
          default:
            throw new BadRequestError({ description: error.description });
        }
      }
      console.error('Service: error refreshing access tokens:', e);
      throw e;
    }
  }

  // URL signer - needed for validating requests on Delivery Gateway
  // More about this: https://docs.jwplayer.com/platform/reference/protect-your-content-with-signed-urls
  async generateSignedUrl(path: string, host: string = this.accessControlClient) {
    const now = new Date();
    const token = jwt.sign(
      {
        exp: Math.ceil((now.getTime() + 3600) / 300) * 300,
        resource: path,
      },
      this.apiSecret,
      {
        noTimestamp: true,
      }
    );

    return `${host}${path}?token=${token}`;
  }
}
