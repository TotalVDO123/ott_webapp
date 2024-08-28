import { useQuery } from 'react-query';
import type { Series } from '@jwp/ott-common/types/series';
import ApiService from '@jwp/ott-common/src/services/ApiService';
import { getModule } from '@jwp/ott-common/src/modules/container';
import { CACHE_TIME, STALE_TIME } from '@jwp/ott-common/src/constants';

export const useNextEpisode = ({ series, episodeId, language }: { series: Series | undefined; episodeId: string | undefined; language: string }) => {
  const apiService = getModule(ApiService);

  const { isLoading, data } = useQuery(
    ['next-episode', series?.series_id, episodeId, language],
    async () => {
      const item = await apiService.getEpisodes({ seriesId: series?.series_id, pageLimit: 1, afterId: episodeId, language });

      return item?.episodes?.[0];
    },
    { staleTime: STALE_TIME, cacheTime: CACHE_TIME, enabled: !!(series?.series_id && episodeId) },
  );

  return {
    isLoading,
    data,
  };
};
