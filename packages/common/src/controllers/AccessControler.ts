import { inject, injectable } from 'inversify';
import type { IntegrationType } from 'packages/common/types/config';

import { useConfigStore } from '../stores/ConfigStore';
import AccessService from '../services/AccessService';
import AccountService from '../services/integrations/AccountService';
import { INTEGRATION_TYPE } from '../modules/types';
import { getNamedModule } from '../modules/container';

@injectable()
export default class AccessControler {
  private readonly accessService: AccessService;
  private readonly accountService: AccountService;

  constructor(@inject(INTEGRATION_TYPE) integrationType: IntegrationType, @inject(AccessService) accessService: AccessService) {
    this.accessService = accessService;
    this.accountService = getNamedModule(AccountService, integrationType);
  }

  initialize = async () => {
    await this.generateOrRetrievePassport();
    // console.log('still continiues');
  };

  generateOrRetrievePassport = async () => {
    const existingPassport = await this.accessService.getPassport();
    if (existingPassport) {
      return existingPassport;
    }

    const {
      config: { siteId },
    } = useConfigStore.getState();
    const auth = await this.accountService.getAuthData();

    const newPassport = await this.accessService.generatePassport(siteId, auth?.jwt);
    await this.accessService.setPassport(newPassport);
  };
}
