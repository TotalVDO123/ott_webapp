import type { GetPlaylistParams, Playlist } from '@jwp/ott-common/types/playlist';

export default abstract class ContentService {
  /**
   * Fetch the content list for the given list id
   */
  abstract getContentList: ({ id, siteId, params }: { id: string | undefined; siteId: string; params: GetPlaylistParams }) => Promise<Playlist | undefined>;

  /**
   * Fetch the content list for the given list id based on the search term
   */
  abstract getContentSearch: ({ id, siteId, params }: { id: string | undefined; siteId: string; params: GetPlaylistParams }) => Promise<Playlist | undefined>;
}
