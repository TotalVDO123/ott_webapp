import { useQuery } from 'react-query';
import type { PlaylistItem } from '@jwp/ott-common/types/playlist';
import ApiService from '@jwp/ott-common/src/services/ApiService';
import { getModule } from '@jwp/ott-common/src/modules/container';
import { useAccessStore } from '@jwp/ott-common/src/stores/AccessStore';
import AccessController from '@jwp/ott-common/src/controllers/AccessController';
import { useConfigStore } from '@jwp/ott-common/src/stores/ConfigStore';
import { ApiError } from '@jwp/ott-common/src/utils/api';

import useContentProtection from './useContentProtection';

export default function useProtectedMedia(item: PlaylistItem) {
  const apiService = getModule(ApiService);
  const accessController = getModule(AccessController);

  const { siteId } = useConfigStore().config;
  const { passport, entitledPlan } = useAccessStore();

  const getMedia = async (token?: string, drmPolicyId?: string) => {
    // If nothing from Access Bridge is present, the flow remains as it was.
    if (!passport || !entitledPlan) {
      return apiService.getMediaById({ id: item.mediaid, token, drmPolicyId });
    }

    // Otherwise use passport to get the media
    // TODO: the logic needs to be revisited once the dependency on planId is changed.
    try {
      return await apiService.getMediaByIdWithPassport({ id: item.mediaid, siteId, planId: entitledPlan.id, passport });
    } catch (error: unknown) {
      if (error instanceof ApiError && error.code === 403) {
        // If the passport is invalid or expired, refresh and get media again
        await accessController.refreshAccessTokens();
        const updatedPassport = useAccessStore.getState().passport;

        if (updatedPassport) {
          return await apiService.getMediaByIdWithPassport({ id: item.mediaid, siteId, planId: entitledPlan.id, passport: updatedPassport });
        }

        throw new Error('Failed to refresh passport and retrieve media.');
      }

      throw error;
    }
  };

  const contentProtectionQuery = useContentProtection('media', item.mediaid, async (token, drmPolicyId) => getMedia(token, drmPolicyId));

  const { isLoading, data: isGeoBlocked } = useQuery(
    ['media', 'geo', item.mediaid],
    () => {
      const m3u8 = contentProtectionQuery.data?.sources.find((source) => source.file.indexOf('.m3u8') !== -1);
      if (m3u8) {
        return fetch(m3u8.file, { method: 'HEAD' }).then((response) => response.status === 403);
      }
      return false;
    },
    {
      enabled: contentProtectionQuery.isFetched,
    },
  );

  return {
    ...contentProtectionQuery,
    isGeoBlocked,
    isLoading: contentProtectionQuery.isLoading || isLoading,
  };
}
