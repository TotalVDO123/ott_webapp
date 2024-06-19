import { shallow } from '@jwp/ott-common/src/utils/compare';
import usePlaylist from '@jwp/ott-hooks-react/src/usePlaylist';
import { PLAYLIST_TYPE } from '@jwp/ott-common/src/constants';
import { useConfigStore } from '@jwp/ott-common/src/stores/ConfigStore';
import type { GetPlaylistParams } from '@jwp/ott-common/types/playlist';

import { useContentList } from './useContentList';

export const usePlaylistContent = ({
  id,
  type,
  params = {},
  enabled = true,
  usePlaceholderData = true,
}: {
  id?: string;
  type: 'playlist' | 'content_list';
  params?: GetPlaylistParams;
  enabled?: boolean;
  usePlaceholderData?: boolean;
}) => {
  const { config } = useConfigStore(({ config }) => ({ config }), shallow);
  const siteId = config?.siteId;

  const playlistQuery = usePlaylist(id || '', params, type === PLAYLIST_TYPE.playlist && enabled, usePlaceholderData);
  const contentListQuery = useContentList({ siteId, enabled: type === PLAYLIST_TYPE.content_list, id });

  return type === PLAYLIST_TYPE.playlist ? playlistQuery : contentListQuery;
};
