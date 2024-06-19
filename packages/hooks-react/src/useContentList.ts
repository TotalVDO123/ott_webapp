import { useQuery, type UseQueryResult } from 'react-query';
import type { Playlist } from '@jwp/ott-common/types/playlist';
import ApiService from '@jwp/ott-common/src/services/ApiService';
import { getModule } from '@jwp/ott-common/src/modules/container';
import { generatePlaylistPlaceholder } from '@jwp/ott-common/src/utils/collection';
import type { ApiError } from '@jwp/ott-common/src/utils/api';
import { STALE_TIME, CACHE_TIME } from '@jwp/ott-common/src/constants';

const placeholderData = generatePlaylistPlaceholder(30);

export const useContentList = ({ id, siteId, enabled }: { id: string | undefined; siteId: string; enabled: boolean }) => {
  const apiService = getModule(ApiService);

  const contentListQuery: UseQueryResult<Playlist | undefined, ApiError> = useQuery(
    ['content-list', id],
    async () => {
      const searchResult = await apiService.getContentList({ siteId, id });

      return searchResult;
    },
    {
      placeholderData: enabled ? placeholderData : undefined,
      enabled: enabled,
      staleTime: STALE_TIME,
      cacheTime: CACHE_TIME,
    },
  );

  return contentListQuery;
};
