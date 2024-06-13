import React from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { Playlist } from '@jwp/ott-common/types/playlist';
import { LIST_TYPE } from '@jwp/ott-common/src/constants';
import { ScreenMap } from '@jwp/ott-common/src/utils/ScreenMap';
import usePlaylist from '@jwp/ott-hooks-react/src/usePlaylist';

import Loading from '../Loading/Loading';
import ErrorPage from '../../components/ErrorPage/ErrorPage';
import type { ScreenComponent } from '../../../types/screens';

import PlaylistGrid from './sharedScreens/PlaylistGrid/PlaylistGrid';

export const playlistScreenMap = new ScreenMap<Playlist, ScreenComponent<Playlist>>();

playlistScreenMap.registerDefault(PlaylistGrid);

const RecommendationsScreenRouter = () => {
  const params = useParams();
  const id = params.id || '';
  const { isLoading, isFetching, error, data } = usePlaylist({ playlistId: id, type: LIST_TYPE.content_list, params: {} });
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

export default RecommendationsScreenRouter;
