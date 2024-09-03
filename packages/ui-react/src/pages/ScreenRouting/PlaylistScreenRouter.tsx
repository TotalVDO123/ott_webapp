import React from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { Playlist } from '@jwp/ott-common/types/playlist';
import { PLAYLIST_TYPE, PLAYLIST_CONTENT_TYPE } from '@jwp/ott-common/src/constants';
import { ScreenMap } from '@jwp/ott-common/src/utils/ScreenMap';
import usePlaylist from '@jwp/ott-hooks-react/src/usePlaylist';
import type { PlaylistMenuType } from '@jwp/ott-common/types/config';

import Loading from '../Loading/Loading';
import ErrorPage from '../../components/ErrorPage/ErrorPage';
import type { ScreenComponent } from '../../../types/screens';

import PlaylistGrid from './playlistScreens/PlaylistGrid/PlaylistGrid';
import PlaylistLiveChannels from './playlistScreens/PlaylistLiveChannels/PlaylistLiveChannels';

export const playlistScreenMap = new ScreenMap<Playlist, ScreenComponent<Playlist>>();
export const contentScreenMap = new ScreenMap<Playlist, ScreenComponent<Playlist>>();

// register playlist screens
playlistScreenMap.registerDefault(PlaylistGrid);
playlistScreenMap.registerByContentType(PlaylistLiveChannels, PLAYLIST_CONTENT_TYPE.live);

// register content list screens
contentScreenMap.registerDefault(PlaylistGrid);

const PlaylistScreenRouter = ({ type }: { type: PlaylistMenuType }) => {
  const params = useParams();
  const id = params.id || '';

  const { isLoading, isFetching, error, data } = usePlaylist(id);
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

  const Screen = type === PLAYLIST_TYPE.content_list ? contentScreenMap.getScreen(data) : playlistScreenMap.getScreen(data);

  return <Screen data={data} isLoading={isFetching} />;
};

export default PlaylistScreenRouter;
