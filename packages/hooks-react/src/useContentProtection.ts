import { useQuery } from 'react-query';
import type { GetPlaylistParams } from '@jwp/ott-common/types/playlist';
import type { GetMediaParams } from '@jwp/ott-common/types/media';
import type { EntitlementType } from '@jwp/ott-common/types/entitlement';
import GenericEntitlementService from '@jwp/ott-common/src/services/GenericEntitlementService';
import JWPEntitlementService from '@jwp/ott-common/src/services/JWPEntitlementService';
import { getModule } from '@jwp/ott-common/src/modules/container';
import AccountController from '@jwp/ott-common/src/controllers/AccountController';
import { useConfigStore } from '@jwp/ott-common/src/stores/ConfigStore';
import { isTruthyCustomParamValue } from '@jwp/ott-common/src/utils/common';
import { useAccountStore } from '@jwp/ott-common/src/stores/AccountStore';

import { generateJwtSignedContentToken, useOAuth } from './useOAuth';

const useContentProtection = <T>(
  type: EntitlementType,
  id: string | undefined,
  callback: (token?: string, drmPolicyId?: string) => Promise<T | undefined>,
  params: GetPlaylistParams | GetMediaParams = {},
  enabled: boolean = true,
  placeholderData?: T,
) => {
  const genericEntitlementService = getModule(GenericEntitlementService);
  const jwpEntitlementService = getModule(JWPEntitlementService);

  const user = useAccountStore((state) => state.user);
  const { token: bearerToken } = useOAuth();

  const { configId, signingConfig, contentProtection, jwp, urlSigning, isOAuthMode } = useConfigStore(({ config }) => ({
    configId: config.id,
    signingConfig: config.contentSigningService,
    contentProtection: config.contentProtection,
    jwp: config.integrations.jwp,
    urlSigning: isTruthyCustomParamValue(config?.custom?.urlSigning),
    isOAuthMode: isTruthyCustomParamValue(config?.custom?.isOAuthMode),
  }));
  const host = signingConfig?.host;
  const drmPolicyId = contentProtection?.drm?.defaultPolicyId ?? signingConfig?.drmPolicyId;
  const signingEnabled = !!urlSigning || !!host || (!!drmPolicyId && !host);

  const { data: token, isLoading } = useQuery(
    ['token', type, id, params, user?.isPremium],
    async () => {
      // if provider is not JWP
      if (!!id && !!host) {
        const accountController = getModule(AccountController);
        const authData = await accountController.getAuthData();
        const { host, drmPolicyId } = signingConfig;

        return genericEntitlementService.getMediaToken(host, id, authData?.jwt, params, drmPolicyId);
      }
      // if provider is JWP
      if (jwp && configId && !!id && signingEnabled) {
        return jwpEntitlementService.getJWPMediaToken(configId, id);
      }

      // if self-signed is enabled in jwp dashboard
      // and
      // isOAuthMode is enabled and user is logged in and in premium mode
      if (!!id && signingEnabled && isOAuthMode && !!user && !!user?.isPremium) {
        return generateJwtSignedContentToken(id, `Bearer ${bearerToken}`);
      }
    },
    { enabled: signingEnabled && enabled && !!id && (isOAuthMode ? !!user?.isPremium : false), keepPreviousData: false, staleTime: 15 * 60 * 1000 },
  );

  const queryResult = useQuery<T | undefined>([type, id, params, token], async () => callback(token, drmPolicyId), {
    enabled: !!id && enabled && (!signingEnabled || !!token),
    placeholderData: id ? placeholderData : undefined,
    retry: 2,
    retryDelay: 1000,
    keepPreviousData: false,
  });

  return {
    ...queryResult,
    user: user,
    isLoading: isLoading || queryResult.isLoading,
  };
};

export default useContentProtection;
