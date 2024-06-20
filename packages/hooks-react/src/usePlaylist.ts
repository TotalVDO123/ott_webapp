import { QueryClient, useQuery, useQueryClient } from 'react-query';
import type { GetPlaylistParams, Playlist } from '@jwp/ott-common/types/playlist';
import ApiService from '@jwp/ott-common/src/services/ApiService';
import { getModule } from '@jwp/ott-common/src/modules/container';
import { generatePlaylistPlaceholder } from '@jwp/ott-common/src/utils/collection';
import { isScheduledOrLiveMedia } from '@jwp/ott-common/src/utils/liveEvent';
import { isTruthyCustomParamValue } from '@jwp/ott-common/src/utils/common';
import type { ApiError } from '@jwp/ott-common/src/utils/api';
import type { PlaylistMenuType } from '@jwp/ott-common/types/config';
import { PLAYLIST_TYPE } from '@jwp/ott-common/src/constants';
import { useConfigStore } from '@jwp/ott-common/src/stores/ConfigStore';

const placeholderData = generatePlaylistPlaceholder(30);

export const getPlaylistQueryOptions = ({
  type,
  contentId,
  siteId,
  enabled,
  usePlaceholderData,
  params = {},
  queryClient,
}: {
  type: PlaylistMenuType;
  contentId: string | undefined;
  siteId: string;
  enabled: boolean;
  queryClient: QueryClient;
  usePlaceholderData?: boolean;
  params?: GetPlaylistParams;
}) => {
  const apiService = getModule(ApiService);

  return {
    enabled: !!contentId && enabled,
    queryKey: ['playlist', type, contentId],
    queryFn: async () => {
      if (type === PLAYLIST_TYPE.playlist) {
        const playlist = await apiService.getPlaylistById(contentId, { page_limit: params?.page_limit });

        // This pre-caches all playlist items and makes navigating a lot faster.
        playlist?.playlist?.forEach((playlistItem) => {
          queryClient.setQueryData(['media', playlistItem.mediaid], playlistItem);
        });

        return playlist;
      } else if (type === PLAYLIST_TYPE.content_list) {
        const contentList = await apiService.getContentList({ siteId, id: contentId });

        return contentList;
      }
    },
    placeholderData: contentId && usePlaceholderData ? placeholderData : undefined,
    refetchInterval: (data: Playlist | undefined) => {
      if (!data) return false;

      const autoRefetch = isTruthyCustomParamValue(data.refetch) || data.playlist.some(isScheduledOrLiveMedia);

      return autoRefetch ? 1000 * 30 : false;
    },
    retry: false,
  };
};

export default function usePlaylist({
  contentId,
  type,
  params = {},
  enabled = true,
  usePlaceholderData = true,
}: {
  contentId?: string;
  type: PlaylistMenuType;
  params?: GetPlaylistParams;
  enabled?: boolean;
  usePlaceholderData?: boolean;
}) {
  const queryClient = useQueryClient();
  const siteId = useConfigStore((state) => state.config.siteId);

  const queryOptions = getPlaylistQueryOptions({ type, contentId, siteId, params, queryClient, enabled, usePlaceholderData });

  return useQuery<Playlist | undefined, ApiError>(queryOptions);
}
