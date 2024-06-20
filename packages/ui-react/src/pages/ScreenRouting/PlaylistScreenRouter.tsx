import React from 'react';
import { useParams, matchPath, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { Playlist } from '@jwp/ott-common/types/playlist';
import { PLAYLIST_TYPE, PLAYLIST_CONTENT_TYPE } from '@jwp/ott-common/src/constants';
import { ScreenMap } from '@jwp/ott-common/src/utils/ScreenMap';
import usePlaylist from '@jwp/ott-hooks-react/src/usePlaylist';
import { PATH_CONTENT_LIST } from '@jwp/ott-common/src/paths';

import Loading from '../Loading/Loading';
import ErrorPage from '../../components/ErrorPage/ErrorPage';
import type { ScreenComponent } from '../../../types/screens';

import PlaylistGrid from './playlistScreens/PlaylistGrid/PlaylistGrid';
import PlaylistLiveChannels from './playlistScreens/PlaylistLiveChannels/PlaylistLiveChannels';

export const playlistScreenMap = new ScreenMap<Playlist, ScreenComponent<Playlist>>();
export const contentScreenMap = new ScreenMap<Playlist, ScreenComponent<Playlist>>();

// register playlist screens
playlistScreenMap.registerDefault(PlaylistGrid);
playlistScreenMap.register(PlaylistLiveChannels, (item) => item?.contentType === PLAYLIST_CONTENT_TYPE.live && item.type === PLAYLIST_TYPE.playlist);

// register content list screens
contentScreenMap.registerDefault(PlaylistGrid);

const PlaylistScreenRouter = () => {
  const params = useParams();
  const location = useLocation();
  const id = params.id || '';

  const type = matchPath(PATH_CONTENT_LIST, location.pathname) ? PLAYLIST_TYPE.content_list : PLAYLIST_TYPE.playlist;

  const { isLoading, isFetching, error, data } = usePlaylist({ contentId: id, type });
  const { t } = useTranslation('error');

  if (isLoading) {
    return <Loading />;
  }

  if (error || !data) {
    return <ErrorPage title={t('playlist_not_found')} />;
  }

  if (data.playlist.length === 0) {
    return <ErrorPage title={t('empty_shelves_heading')} message={t('empty_shelves_description')} />;
  }

  const PlaylistScreen = playlistScreenMap.getScreen(data);

  return <PlaylistScreen data={data} isLoading={isFetching} />;
};

export default PlaylistScreenRouter;
