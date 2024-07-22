import { inject, injectable } from 'inversify';

import type { SignedMediaResponse } from './integrations/jwp/types';
import JWPAPIService from './integrations/jwp/JWPAPIService';

@injectable()
export default class JWPEntitlementService {
  private readonly apiService;

  constructor(@inject(JWPAPIService) apiService: JWPAPIService) {
    this.apiService = apiService;
  }

  getJWPMediaToken = async (configId: string = '', mediaId: string) => {
    try {
      const data = await this.apiService.get<SignedMediaResponse>(
        'v2/items/jw-media/token',
        {
          withAuthentication: true,
        },
        {
          app_config_id: configId,
          media_id: mediaId,
        },
      );

      return data.token;
    } catch {
      throw new Error('Unauthorized');
    }
  };
}
