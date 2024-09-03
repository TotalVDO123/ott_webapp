import { inject, injectable } from 'inversify';

import type { IntegrationType } from '../../types/config';
import { useConfigStore } from '../stores/ConfigStore';
import AccessService from '../services/AccessService';
import AccountService from '../services/integrations/AccountService';
import { INTEGRATION_TYPE } from '../modules/types';
import { getNamedModule } from '../modules/container';

@injectable()
export default class AccessController {
  private readonly accessService: AccessService;
  private readonly accountService: AccountService;

  private siteId: string = '';
  private apiAccessBridgeUrl: string | undefined = '';

  constructor(@inject(INTEGRATION_TYPE) integrationType: IntegrationType, @inject(AccessService) accessService: AccessService) {
    this.accessService = accessService;
    this.accountService = getNamedModule(AccountService, integrationType);
  }

  initialize = async () => {
    const { config, settings, accessModel } = useConfigStore.getState();
    this.siteId = config.siteId;
    this.apiAccessBridgeUrl = settings?.apiAccessBridgeUrl;

    // If the APP_API_ACCESS_BRIDGE_URL environment variable is defined, useAccessBridge will return true
    // For the AVOD access model, signing and DRM are not supported, so passport generation is skipped
    if (!this.apiAccessBridgeUrl || accessModel === 'AVOD') {
      return;
    }

    // Not awaiting to avoid blocking the loading process,
    // as the passport can be stored asynchronously without affecting the app's performance
    this.generateOrRetrievePassport();
  };

  generateOrRetrievePassport = async () => {
    if (!this.apiAccessBridgeUrl) {
      return;
    }

    const existingPassport = await this.accessService.getPassport();
    if (existingPassport) {
      return existingPassport;
    }

    const auth = await this.accountService.getAuthData();
    const newPassport = await this.accessService.generatePassport(this.apiAccessBridgeUrl, this.siteId, auth?.jwt);
    if (newPassport) {
      await this.accessService.setPassport(newPassport);
    }
  };

  generatePassport = async () => {
    if (!this.apiAccessBridgeUrl) {
      return;
    }

    const { config } = useConfigStore.getState();
    const auth = await this.accountService.getAuthData();

    const passport = await this.accessService.generatePassport(this.apiAccessBridgeUrl, config.siteId, auth?.jwt);
    if (passport) {
      await this.accessService.setPassport(passport);
    }
  };
}
