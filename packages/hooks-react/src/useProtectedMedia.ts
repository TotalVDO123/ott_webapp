import { useQuery } from 'react-query';
import type { PlaylistItem } from '@jwp/ott-common/types/playlist';
import ApiService from '@jwp/ott-common/src/services/ApiService';
import { getModule } from '@jwp/ott-common/src/modules/container';
import { useTranslation } from 'react-i18next';

import useContentProtection from './useContentProtection';

export default function useProtectedMedia(item: PlaylistItem) {
  // Determine currently selected language
  const { i18n } = useTranslation('menu');
  const language = i18n.language;

  const apiService = getModule(ApiService);
  const contentProtectionQuery = useContentProtection('media', item.mediaid, (token, drmPolicyId) =>
    apiService.getMediaById(item.mediaid, language, token, drmPolicyId),
  );

  const { isLoading, data: isGeoBlocked } = useQuery(
    ['media', 'geo', item.mediaid, language],
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
