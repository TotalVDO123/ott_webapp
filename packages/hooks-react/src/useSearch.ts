import { useQuery, type UseQueryResult } from 'react-query';
import { shallow } from '@jwp/ott-common/src/utils/compare';
import { getModule } from '@jwp/ott-common/src/modules/container';
import type { ApiError } from '@jwp/ott-common/src/utils/api';
import { CACHE_TIME, LIST_TYPE, STALE_TIME } from '@jwp/ott-common/src/constants';
import { useConfigStore } from '@jwp/ott-common/src/stores/ConfigStore';
import { isTruthyCustomParamValue } from '@jwp/ott-common/src/utils/common';
import type { Playlist } from '@jwp/ott-common/types/playlist';
import { generatePlaylistPlaceholder } from '@jwp/ott-common/src/utils/collection';
import ContentController from '@jwp/ott-common/src/controllers/ContentController';

const placeholderData = generatePlaylistPlaceholder(30);

export const useSearch = (query: string) => {
  const { config } = useConfigStore(({ config }) => ({ config }), shallow);

  const searchPlaylist = config?.features?.searchPlaylist;
  const hasAppContentSearch = isTruthyCustomParamValue(config?.custom?.appContentSearch);
  const contentController = getModule(ContentController);

  const searchQuery: UseQueryResult<Playlist | undefined, ApiError> = useQuery(
    ['search', query],
    async () => {
      const searchResult = await contentController.getContentSearch(searchPlaylist || '', hasAppContentSearch ? LIST_TYPE.content_list : LIST_TYPE.playlist, {
        search: query || '',
      });

      return searchResult;
    },
    {
      placeholderData,
      staleTime: STALE_TIME,
      cacheTime: CACHE_TIME,
    },
  );

  return { isFetching: searchQuery.isFetching, error: searchQuery.error, data: searchQuery.data };
};
