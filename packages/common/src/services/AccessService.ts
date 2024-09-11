import { inject, injectable } from 'inversify';

import type { AccessTokens } from '../../types/access';
import { logError } from '../logger';
import { API_ACCESS_BRIDGE_URL } from '../modules/types';

@injectable()
export default class AccessService {
  private readonly apiAccessBridgeUrl;

  constructor(@inject(API_ACCESS_BRIDGE_URL) apiAccessBridgeUrl: string) {
    this.apiAccessBridgeUrl = apiAccessBridgeUrl;
  }

  generateAccessTokens = async (siteId: string, jwt?: string): Promise<AccessTokens | null> => {
    const url = `${this.apiAccessBridgeUrl}/v2/sites/${siteId}/access/generate`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: jwt ? `Bearer ${jwt}` : '',
      },
    });

    if (!response.ok) {
      logError('AccessService', 'Failed to get generateAccessTokens', {
        status: response.status,
        error: response.json(),
      });

      return null;
    }

    return (await response.json()) as AccessTokens;
  };
}
