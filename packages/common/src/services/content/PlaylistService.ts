import { injectable } from 'inversify';

import type { GetContentListParams, GetContentSearchParams, Playlist } from '../../../types/playlist';
import { createURL } from '../../utils/urlFormatting';
import { getDataOrThrow } from '../../utils/api';
import env from '../../env';
import ApiService from '../ApiService';

import ContentService from './ContentService';

@injectable()
export default class PlaylistService extends ContentService {
  private readonly apiService;

  constructor(apiService: ApiService) {
    super();
    this.apiService = apiService;
  }

  /**
   * Transform incoming playlists
   */
  private transformPlaylist = (playlist: Playlist, relatedMediaId?: string) => {
    playlist.playlist = playlist.playlist.map((item) => this.apiService.transformMediaItem(item, playlist));

    // remove the related media item (when this is a recommendations playlist)
    if (relatedMediaId) playlist.playlist.filter((item) => item.mediaid !== relatedMediaId);

    return playlist;
  };

  getPlaylist = async ({ id, params = {} }: { id: string | undefined; params: Record<string, string> }): Promise<Playlist | undefined> => {
    if (!id) {
      return undefined;
    }

    const pathname = `/v2/playlists/${id}`;
    const url = createURL(`${env.APP_API_BASE_URL}${pathname}`, params);
    const response = await fetch(url);
    const data = (await getDataOrThrow(response)) as Playlist;

    return this.transformPlaylist(data, params.related_media_id);
  };

  /**
   * Get playlist by id
   */
  getContentList = async ({ id, params }: { id: string | undefined; params: GetContentListParams }): Promise<Playlist | undefined> => {
    return this.getPlaylist({ id, params });
  };

  /**
   * Get search playlist by id
   */
  getContentSearch = async ({ id, params }: { id: string | undefined; params: GetContentSearchParams }): Promise<Playlist | undefined> => {
    return this.getPlaylist({ id, params });
  };
}
