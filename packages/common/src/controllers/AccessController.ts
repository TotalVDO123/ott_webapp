import { inject, injectable } from 'inversify';

import type { IntegrationType } from '../../types/config';
import type { AuthData } from '../../types/account';
import { useConfigStore } from '../stores/ConfigStore';
import AccessService from '../services/AccessService';
import AccountService from '../services/integrations/AccountService';
import { INTEGRATION_TYPE } from '../modules/types';
import { getNamedModule } from '../modules/container';

@injectable()
export default class AccessController {
  private readonly accessService: AccessService;
  private readonly accountService: AccountService;
  private readonly useAccessBridge: boolean;

  constructor(@inject(INTEGRATION_TYPE) integrationType: IntegrationType, @inject(AccessService) accessService: AccessService) {
    this.accessService = accessService;
    this.accountService = getNamedModule(AccountService, integrationType);
    this.useAccessBridge = useConfigStore.getState().useAccessBridge;
  }

  initialize = async () => {
    const { accessModel } = useConfigStore.getState();

    if (accessModel === 'AVOD') {
      await this.generateOrRetrievePassport();
    } else {
      // If authentication is required (i.e., accessModel !== 'AVOD'),
      // ensure the user is authenticated before generating the passport
      // This prevents the need of generating a new passport post-login
      const auth = await this.accountService.getAuthData();
      if (auth) {
        await this.generateOrRetrievePassport(auth);
      }
    }
  };

  generateOrRetrievePassport = async (auth: AuthData | null = null) => {
    if (!this.useAccessBridge) {
      return;
    }

    const existingPassport = await this.accessService.getPassport();
    if (existingPassport) {
      return existingPassport;
    }

    const { config } = useConfigStore.getState();

    const newPassport = await this.accessService.generatePassport(config.siteId, auth?.jwt);
    if (newPassport) {
      await this.accessService.setPassport(newPassport);
    }
  };

  generatePassport = async () => {
    if (!this.useAccessBridge) {
      return;
    }

    const { config } = useConfigStore.getState();
    const auth = await this.accountService.getAuthData();

    const passport = await this.accessService.generatePassport(config.siteId, auth?.jwt);
    if (passport) {
      await this.accessService.setPassport(passport);
    }
  };
}
