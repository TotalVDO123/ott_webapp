import { inject, injectable } from 'inversify';

import type { IntegrationType } from '../../types/config';
import { useConfigStore } from '../stores/ConfigStore';
import AccessService from '../services/AccessService';
import AccountService from '../services/integrations/AccountService';
import { INTEGRATION_TYPE } from '../modules/types';
import { getNamedModule } from '../modules/container';
import StorageService from '../services/StorageService';
import type { AccessTokens } from '../../types/access';
import { useAccessStore } from '../stores/AccessStore';
import JWPEntitlementService from '../services/JWPEntitlementService';

const ACCESS_TOKENS = 'access_tokens';

@injectable()
export default class AccessController {
  private readonly entitlementService: JWPEntitlementService;
  private readonly accessService: AccessService;
  private readonly accountService: AccountService;
  private readonly storageService: StorageService;

  private siteId: string = '';

  constructor(
    @inject(INTEGRATION_TYPE) integrationType: IntegrationType,
    @inject(JWPEntitlementService) entitlementService: JWPEntitlementService,
    @inject(StorageService) storageService: StorageService,
    @inject(AccessService) accessService: AccessService,
  ) {
    this.entitlementService = entitlementService;
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

    // Fetches the entitled plans for the viewer and stores them into the access store.
    await this.fetchAndStoreEntitledPlans();
  };

  getMediaById = async () => {};

  fetchAndStoreEntitledPlans = async () => {
    if (!this.siteId) {
      return;
    }
    // Note: Without a valid plan ID, requests for media metadata cannot be made.
    // TODO: Support for multiple plans should be added. Revisit this logic once the dependency on plan_id is changed.
    const response = await this.entitlementService.getEntitledPlans({ siteId: this.siteId });
    if (response?.plans?.length) {
      // Find the SVOD plan or fallback to the first available plan
      const entitledPlan = response.plans.find((plan) => plan.metadata.access_model === 'svod') || response.plans[0];
      useAccessStore.setState({ entitledPlan });
    }
  };

  generateOrRefreshAccessTokens = async () => {
    const existingAccessTokens = await this.getAccessTokens();
    const shouldRefresh = existingAccessTokens && Date.now() > existingAccessTokens.expires;

    if (!existingAccessTokens) {
      await this.generateAccessTokens();
    }

    if (shouldRefresh) {
      return await this.refreshAccessTokens();
    }

    return;
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

  refreshAccessTokens = async () => {
    const existingAccessTokens = await this.getAccessTokens();
    // there is no access tokens stored, nothing to refresh
    if (!existingAccessTokens) {
      return;
    }

    const accessTokens = await this.accessService.refreshAccessTokens(this.siteId, existingAccessTokens.refresh_token);
    if (accessTokens) {
      await this.setAccessTokens(accessTokens);
    }
  };

  setAccessTokens = async (accessTokens: AccessTokens) => {
    useAccessStore.setState({ passport: accessTokens.passport });

    // Since the actual valid time for a passport token is 1 hour, set the expires to one hour from now.
    // The expires field here is used as a helper to manage the passport's validity and refresh process.
    const expires = new Date(Date.now() + 3600 * 1000).getTime();
    return await this.storageService.setItem(ACCESS_TOKENS, JSON.stringify({ ...accessTokens, expires }), true);
  };

  getAccessTokens = async (): Promise<(AccessTokens & { expires: number }) | null> => {
    const accessTokens = await this.storageService.getItem<AccessTokens & { expires: number }>(ACCESS_TOKENS, true, true);
    if (accessTokens) {
      useAccessStore.setState({ passport: accessTokens.passport });
    }

    return accessTokens;
  };

  removeAccessTokens = async () => {
    useAccessStore.setState({ passport: null });
    return await this.storageService.removeItem(ACCESS_TOKENS);
  };
}
