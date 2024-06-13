import { injectable } from 'inversify';

import type { GetPlaylistParams, Playlist, PlaylistItem } from '../../../types/playlist';
import type { ContentList } from '../../../types/content-list';
import { createURL } from '../../utils/urlFormatting';
import { getDataOrThrow } from '../../utils/api';
import env from '../../env';
import ApiService from '../ApiService';

import ContentService from './ContentService';

@injectable()
export default class RecommendationsService extends ContentService {
  private readonly apiService;

  constructor(apiService: ApiService) {
    super();
    this.apiService = apiService;
  }

  /**
   * Transform incoming recommendations lists
   */
  private transformContentList = (contentList: ContentList): Playlist => {
    const { list, ...rest } = contentList;

    const playlist: Playlist = { ...rest, playlist: [] };

    playlist.playlist = contentList.list.map((item) => {
      const { custom_params, media_id, description, tags, ...rest } = item;

      const playlistItem: PlaylistItem = {
        feedid: contentList.id,
        mediaid: media_id,
        tags: tags.join(','),
        description: description || '',
        sources: [],
        images: [],
        image: '',
        link: '',
        pubdate: 0,
        ...rest,
        ...custom_params,
      };

      return this.apiService.transformMediaItem(playlistItem, playlist);
    });

    return playlist;
  };

  /**
   * Get recommendations by id
   */
  getContentList = async ({ id, siteId, params }: { id: string | undefined; siteId: string; params: GetPlaylistParams }): Promise<Playlist | undefined> => {
    if (!id || !siteId) {
      throw new Error('List ID and Site ID are required');
    }

    const pathname = `/v2/sites/${siteId}/content_lists/${id}`;
    const url = createURL(`${env.APP_API_BASE_URL}${pathname}`, params);
    const response = await fetch(url);
    const data = (await getDataOrThrow(response)) as ContentList;

    return this.transformContentList(data);
  };

  getContentSearch = async ({ siteId, params }: { siteId: string; params: GetPlaylistParams }) => {
    const pathname = `/v2/sites/${siteId}/app_content/media/search`;

    const url = createURL(`${env.APP_API_BASE_URL}${pathname}`, {
      search_query: params.search,
    });

    const response = await fetch(url);
    const data = (await getDataOrThrow(response)) as ContentList;

    return this.transformContentList(data);
  };
}
