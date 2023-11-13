import { useQuery } from 'react-query';

import { useConfigStore } from '#src/stores/ConfigStore';
import type { GetPlaylistParams } from '#types/playlist';
import type { GetMediaParams } from '#types/media';
import AccountController from '#src/stores/AccountController';
import EntitlementController from '#src/stores/EntitlementController';
import { getModule } from '#src/modules/container';

const useContentProtection = <T>(
  type: EntitlementType,
  id: string | undefined,
  callback: (token?: string, drmPolicyId?: string) => Promise<T | undefined>,
  params: GetPlaylistParams | GetMediaParams = {},
  enabled: boolean = true,
  placeholderData?: T,
) => {
  const entitlementController = getModule(EntitlementController);

  const { configId, signingConfig, contentProtection, jwp, urlSigning } = useConfigStore(({ config }) => ({
    configId: config.id,
    signingConfig: config.contentSigningService,
    contentProtection: config.contentProtection,
    jwp: config.integrations.jwp,
    urlSigning: config?.custom?.urlSigning,
  }));
  const host = signingConfig?.host;
  const drmPolicyId = contentProtection?.drm?.defaultPolicyId ?? signingConfig?.drmPolicyId;
  const signingEnabled = !!urlSigning || !!host || (!!drmPolicyId && !host);

  const { data: token, isLoading } = useQuery(
    ['token', type, id, params],
    async () => {
      // if provider is not JWP
      if (!!id && !!host) {
        const accountController = getModule(AccountController);
        const authData = await accountController.getAuthData();
        const { host, drmPolicyId } = signingConfig;

        return entitlementController.getMediaToken(host, id, authData?.jwt, params, drmPolicyId);
      }
      // if provider is JWP
      if (jwp && configId && !!id && signingEnabled) {
        return entitlementController.getJWPMediaToken(configId, id);
      }
    },
    { enabled: signingEnabled && enabled && !!id, keepPreviousData: false, staleTime: 15 * 60 * 1000 },
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
    isLoading: isLoading || queryResult.isLoading,
  };
};

export default useContentProtection;
