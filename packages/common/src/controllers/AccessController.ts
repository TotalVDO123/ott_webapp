import { inject, injectable } from 'inversify';

import type { IntegrationType } from '../../types/config';
import { useConfigStore } from '../stores/ConfigStore';
import AccessService from '../services/AccessService';
import AccountService from '../services/integrations/AccountService';
import { INTEGRATION_TYPE } from '../modules/types';
import { getNamedModule } from '../modules/container';
import StorageService from '../services/StorageService';
import type { AccessTokens } from '../../types/access';

const ACCESS_TOKENS = 'access_tokens';

@injectable()
export default class AccessController {
  private readonly accessService: AccessService;
  private readonly accountService: AccountService;
  private readonly storageService: StorageService;

  private siteId: string = '';

  constructor(
    @inject(INTEGRATION_TYPE) integrationType: IntegrationType,
    @inject(StorageService) storageService: StorageService,
    @inject(AccessService) accessService: AccessService,
  ) {
    this.accessService = accessService;
    this.storageService = storageService;
    this.accountService = getNamedModule(AccountService, integrationType);
  }

  initialize = async () => {
    const { config, accessModel } = useConfigStore.getState();
    this.siteId = config.siteId;

    // For the AVOD access model, signing and DRM are not supported, so access tokens generation is skipped
    if (accessModel === 'AVOD') {
      return;
    }

    // Not awaiting to avoid blocking the loading process,
    // as the access tokens can be stored asynchronously without affecting the app's performance
    void this.generateOrRefreshAccessTokens();
  };

  generateOrRefreshAccessTokens = async () => {
    const existing = await this.getAccessTokens();
    if (existing) {
      // do nothing if passport exists
      return;
    }

    // TODO: the next PR will address the refreshment
    // https://jwplayer.atlassian.net/browse/IDM-173

    await this.generateAccessTokens();
  };

  generateAccessTokens = async () => {
    if (!this.siteId) {
      return;
    }

    const auth = await this.accountService.getAuthData();

    const accessTokens = await this.accessService.generateAccessTokens(this.siteId, auth?.jwt);
    if (accessTokens) {
      await this.setAccessTokens(accessTokens);
    }
  };

  setAccessTokens = async (accessTokens: AccessTokens) => {
    // Since the actual valid time for a passport token is 1 hour, set the expires to one hour from now.
    // The expires field here is used as a helper to manage the passport's validity and refresh process.
    const expires = new Date(Date.now() + 3600 * 1000).getTime();
    return await this.storageService.setItem(ACCESS_TOKENS, JSON.stringify({ ...accessTokens, expires }), true);
  };

  getAccessTokens = async (): Promise<(AccessTokens & { expires: string }) | null> => {
    return await this.storageService.getItem(ACCESS_TOKENS, true, true);
  };

  removeAccessTokens = async () => {
    return await this.storageService.removeItem(ACCESS_TOKENS);
  };
}
