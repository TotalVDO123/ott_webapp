import { useQuery, useQueryClient } from 'react-query';
import type { GetPlaylistParams, Playlist } from '@jwp/ott-common/types/playlist';
import type { ApiError } from '@jwp/ott-common/src/utils/api';
import type { ListType } from '@jwp/ott-common/types/config';
import { getModule } from '@jwp/ott-common/src/modules/container';
import { generatePlaylistPlaceholder } from '@jwp/ott-common/src/utils/collection';
import { isScheduledOrLiveMedia } from '@jwp/ott-common/src/utils/liveEvent';
import { isTruthyCustomParamValue } from '@jwp/ott-common/src/utils/common';
import ContentController from '@jwp/ott-common/src/controllers/ContentController';

const placeholderData = generatePlaylistPlaceholder(30);

export default function usePlaylist({
  playlistId,
  type,
  params,
  enabled = true,
  usePlaceholderData = true,
}: {
  playlistId: string | undefined;
  type: Exclude<ListType, 'continue_watching' | 'favorites'>;
  params: GetPlaylistParams;
  enabled?: boolean;
  usePlaceholderData?: boolean;
}) {
  const contentController = getModule(ContentController);
  const queryClient = useQueryClient();

  const callback = async (playlistId?: string, params?: GetPlaylistParams) => {
    const playlist = await contentController.getContentList(playlistId, type, { ...params });

    // This pre-caches all playlist items and makes navigating a lot faster.
    playlist?.playlist?.forEach((playlistItem) => {
      queryClient.setQueryData(['media', playlistItem.mediaid], playlistItem);
    });

    return playlist;
  };

  const queryKey = ['playlist', playlistId, params];
  const isEnabled = !!playlistId && enabled;

  return useQuery<Playlist | undefined, ApiError>(queryKey, () => callback(playlistId, params), {
    enabled: isEnabled,
    placeholderData: usePlaceholderData && isEnabled ? placeholderData : undefined,
    refetchInterval: (data, _) => {
      if (!data) return false;

      const autoRefetch = isTruthyCustomParamValue(data.refetch) || data.playlist.some(isScheduledOrLiveMedia);

      return autoRefetch ? 1000 * 30 : false;
    },
    retry: false,
  });
}
