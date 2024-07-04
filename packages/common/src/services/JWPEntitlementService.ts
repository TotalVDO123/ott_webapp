import { inject, injectable } from 'inversify';

import JWPAPIService from './integrations/jwp/base/JWPAPIService';
import type { SignedMediaResponse } from './integrations/jwp/base/types';

@injectable()
export default class JWPEntitlementService {
  private readonly apiService;

  constructor(@inject(JWPAPIService) apiService: JWPAPIService) {
    this.apiService = apiService;
  }

  getJWPMediaToken = async (configId: string = '', mediaId: string) => {
    try {
      const data = await this.apiService.get<SignedMediaResponse>(`v2/items/jw-media/token?app_config_id=${configId}&media_id=${mediaId}`, {
        withAuthentication: true,
      });

      return data.token;
    } catch {
      throw new Error('Unauthorized');
    }
  };
}
