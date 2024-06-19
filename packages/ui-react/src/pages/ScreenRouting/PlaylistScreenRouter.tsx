import React from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { Playlist } from '@jwp/ott-common/types/playlist';
import { PLAYLIST_TYPE, PLAYLIST_CONTENT_TYPE } from '@jwp/ott-common/src/constants';
import { ScreenMap } from '@jwp/ott-common/src/utils/ScreenMap';
import { usePlaylistContent } from '@jwp/ott-hooks-react/src/usePlaylistContent';

import Loading from '../Loading/Loading';
import ErrorPage from '../../components/ErrorPage/ErrorPage';
import type { ScreenComponent } from '../../../types/screens';
import useQueryParam from '../../hooks/useQueryParam';

import PlaylistGrid from './sharedScreens/PlaylistGrid/PlaylistGrid';
import PlaylistLiveChannels from './playlistScreens/PlaylistLiveChannels/PlaylistLiveChannels';

export const playlistScreenMap = new ScreenMap<Playlist, ScreenComponent<Playlist>>();

const PlaylistScreenRouter = () => {
  const params = useParams();
  const id = params.id || '';
  const type = (useQueryParam('t') || PLAYLIST_TYPE.playlist) as 'playlist' | 'content_list';

  const { isLoading, isFetching, error, data } = usePlaylistContent({ id, type });
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

  // register playlist screens
  playlistScreenMap.registerDefault(PlaylistGrid);
  if (type === PLAYLIST_TYPE.playlist) {
    playlistScreenMap.registerByContentType(PlaylistLiveChannels, PLAYLIST_CONTENT_TYPE.live);
  }

  const PlaylistScreen = playlistScreenMap.getScreen(data);

  return <PlaylistScreen data={data} isLoading={isFetching} />;
};

export default PlaylistScreenRouter;
