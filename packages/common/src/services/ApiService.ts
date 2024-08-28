import { isValid, parseISO } from 'date-fns';
import { injectable } from 'inversify';

import { getMediaStatusFromEventState } from '../utils/liveEvent';
import { createURL } from '../utils/urlFormatting';
import { getDataOrThrow } from '../utils/api';
import { filterMediaOffers } from '../utils/entitlements';
import { useConfigStore as ConfigStore } from '../stores/ConfigStore';
import type { GetPlaylistParams, Playlist, PlaylistItem } from '../../types/playlist';
import type { ContentList, GetContentSearchParams } from '../../types/content-list';
import type { AdSchedule } from '../../types/ad-schedule';
import type { EpisodeInSeries, EpisodesRes, EpisodesWithPagination, GetSeriesParams, Series } from '../../types/series';
import env from '../env';
import { logError } from '../logger';

// change the values below to change the property used to look up the alternate image
enum ImageProperty {
  CARD = 'card',
  BACKGROUND = 'background',
  CHANNEL_LOGO = 'channel_logo',
}

const PAGE_LIMIT = 20;

@injectable()
export default class ApiService {
  /**
   * We use playlistLabel prop to define the label used for all media items inside.
   * That way we can change the behavior of the same media items being in different playlists
   */
  private generateAlternateImageURL = ({ mediaId, label, playlistLabel }: { mediaId: string; label: string; playlistLabel?: string }) => {
    const pathname = `/v2/media/${mediaId}/images/${playlistLabel || label}.webp`;
    const url = createURL(`${env.APP_API_BASE_URL}${pathname}`, { poster_fallback: 1, fallback: playlistLabel ? label : null });

    return url;
  };

  private parseDate = (item: PlaylistItem, prop: string) => {
    const date = item[prop] as string | undefined;

    if (date && !isValid(new Date(date))) {
      logError('ApiService', `Invalid "${prop}" date provided for the "${item.title}" media item`, { error: new Error('Invalid date') });
      return undefined;
    }

    return date ? parseISO(date) : undefined;
  };

  private getTranslatedFields = (item: PlaylistItem, language: string, defaultLanguage: string) => {
    const newItem = { ...item };

    if (language !== defaultLanguage) {
      for (const [key, _] of Object.entries(newItem)) {
        if (!key.includes(`-${language}`) && item[`${key}-${language}`]) {
          newItem[key] = item[`${key}-${language}`] as string;
        }
      }
    }

    return newItem;
  };

  /**
   * Transform incoming content lists
   */
  private transformContentList = (contentList: ContentList, language: string): Playlist => {
    const { list, ...rest } = contentList;

    const playlist: Playlist = { ...rest, playlist: [] };

    playlist.playlist = list.map((item) => {
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

      return this.transformMediaItem(playlistItem, language, playlist);
    });

    return playlist;
  };

  /**
   * Transform incoming playlists
   */
  private transformPlaylist = (playlist: Playlist, language: string, relatedMediaId?: string) => {
    playlist.playlist = playlist.playlist.map((item) => this.transformMediaItem(item, language, playlist));

    // remove the related media item (when this is a recommendations playlist)
    if (relatedMediaId) {
      playlist.playlist = playlist.playlist.filter((item) => item.mediaid !== relatedMediaId);
    }

    return playlist;
  };

  /**
   * Transform incoming media items
   * - Parses productId into MediaOffer[] for all cleeng offers
   */
  transformMediaItem = (item: PlaylistItem, language: string, playlist?: Playlist) => {
    const config = ConfigStore.getState().config;
    const offerKeys = Object.keys(config?.integrations)[0];
    const playlistLabel = playlist?.imageLabel;
    const mediaId = item.mediaid;
    const defaultLanguage = env.APP_DEFAULT_LANGUAGE || 'en';
    const translatedFields = this.getTranslatedFields(item, language, defaultLanguage);

    const transformedMediaItem = {
      ...item,
      ...translatedFields,
      cardImage: this.generateAlternateImageURL({ mediaId, label: ImageProperty.CARD, playlistLabel }),
      channelLogoImage: this.generateAlternateImageURL({ mediaId, label: ImageProperty.CHANNEL_LOGO, playlistLabel }),
      backgroundImage: this.generateAlternateImageURL({ mediaId, label: ImageProperty.BACKGROUND }),
      mediaOffers: item.productIds ? filterMediaOffers(offerKeys, item.productIds) : undefined,
      scheduledStart: this.parseDate(item, 'VCH.ScheduledStart'),
      scheduledEnd: this.parseDate(item, 'VCH.ScheduledEnd'),
    };

    // add the media status to the media item after the transformation because the live media status depends on the scheduledStart and scheduledEnd
    transformedMediaItem.mediaStatus = getMediaStatusFromEventState(transformedMediaItem);

    return transformedMediaItem;
  };

  private transformEpisodes = (episodesRes: EpisodesRes, language: string, seasonNumber?: number) => {
    const { episodes, page, page_limit, total } = episodesRes;

    // Adding images and keys for media items
    return {
      episodes: episodes
        .filter((el) => el.media_item)
        .map((el) => ({
          ...this.transformMediaItem(el.media_item as PlaylistItem, language),
          seasonNumber: seasonNumber?.toString() || el.season_number?.toString() || '',
          episodeNumber: String(el.episode_number),
        })),
      pagination: { page, page_limit, total },
    };
  };

  /**
   * Get watchlist by playlistId
   */
  getMediaByWatchlist = async (playlistId: string, mediaIds: string[], language: string, token?: string): Promise<PlaylistItem[] | undefined> => {
    if (!mediaIds?.length) {
      return [];
    }

    const pathname = `/apps/watchlists/${playlistId}`;
    const url = createURL(`${env.APP_API_BASE_URL}${pathname}`, { token, media_ids: mediaIds });
    const response = await fetch(url);
    const data = (await getDataOrThrow(response)) as Playlist;

    if (!data) throw new Error(`The data was not found using the watchlist ${playlistId}`);

    return (data.playlist || []).map((item) => this.transformMediaItem(item, language));
  };

  /**
   * Get media by id
   * @param {string} id
   * @param {string} [token]
   * @param {string} [drmPolicyId]
   */
  getMediaById = async (id: string, language: string, token?: string, drmPolicyId?: string): Promise<PlaylistItem | undefined> => {
    const pathname = drmPolicyId ? `/v2/media/${id}/drm/${drmPolicyId}` : `/v2/media/${id}`;
    const url = createURL(`${env.APP_API_BASE_URL}${pathname}`, { token });
    const response = await fetch(url);
    const data = (await getDataOrThrow(response)) as Playlist;
    const mediaItem = data.playlist[0];

    if (!mediaItem) throw new Error('MediaItem not found');

    return this.transformMediaItem(mediaItem, language);
  };

  /**
   * Get series by id
   * @param {string} id
   * @param params
   */
  getSeries = async (id: string, params: GetSeriesParams = {}): Promise<Series | undefined> => {
    if (!id) {
      throw new Error('Series ID is required');
    }

    const pathname = `/apps/series/${id}`;
    const url = createURL(`${env.APP_API_BASE_URL}${pathname}`, params);
    const response = await fetch(url);

    return (await getDataOrThrow(response)) as Series;
  };

  /**
   * Get all series for the given media_ids
   */
  getSeriesByMediaIds = async (mediaIds: string[]): Promise<Record<string, EpisodeInSeries[]> | undefined> => {
    const pathname = `/apps/series`;
    const url = `${env.APP_API_BASE_URL}${pathname}?media_ids=${mediaIds.join(',')}`;
    const response = await fetch(url);

    return (await getDataOrThrow(response)) as Record<string, EpisodeInSeries[]>;
  };

  /**
   * Get all episodes of the selected series (when no particular season is selected or when episodes are attached to series)
   */
  getEpisodes = async ({
    seriesId,
    pageOffset,
    pageLimit = PAGE_LIMIT,
    afterId,
    language,
  }: {
    seriesId: string | undefined;
    pageOffset?: number;
    pageLimit?: number;
    afterId?: string;
    language: string;
  }): Promise<EpisodesWithPagination> => {
    if (!seriesId) {
      throw new Error('Series ID is required');
    }

    const pathname = `/apps/series/${seriesId}/episodes`;
    const url = createURL(`${env.APP_API_BASE_URL}${pathname}`, {
      page_offset: pageOffset,
      page_limit: pageLimit,
      after_id: afterId,
    });

    const response = await fetch(url);
    const episodesResponse = (await getDataOrThrow(response)) as EpisodesRes;

    return this.transformEpisodes(episodesResponse, language);
  };

  /**
   * Get season of the selected series
   */
  getSeasonWithEpisodes = async ({
    seriesId,
    seasonNumber,
    pageOffset,
    pageLimit = PAGE_LIMIT,
    language,
  }: {
    seriesId: string | undefined;
    language: string;
    seasonNumber: number;
    pageOffset?: number;
    pageLimit?: number;
  }): Promise<EpisodesWithPagination> => {
    if (!seriesId) {
      throw new Error('Series ID is required');
    }

    const pathname = `/apps/series/${seriesId}/seasons/${seasonNumber}/episodes`;
    const url = createURL(`${env.APP_API_BASE_URL}${pathname}`, { page_offset: pageOffset, page_limit: pageLimit });

    const response = await fetch(url);
    const episodesRes = (await getDataOrThrow(response)) as EpisodesRes;

    return this.transformEpisodes(episodesRes, language, seasonNumber);
  };

  getAdSchedule = async (id: string | undefined | null): Promise<AdSchedule | undefined> => {
    if (!id) {
      throw new Error('Ad Schedule ID is required');
    }

    const url = env.APP_API_BASE_URL + `/v2/advertising/schedules/${id}.json`;
    const response = await fetch(url, { credentials: 'omit' });

    return (await getDataOrThrow(response)) as AdSchedule;
  };

  /**
   * Get playlist by id
   */
  getPlaylistById = async (id?: string, params: GetPlaylistParams = {}, language: string = env.APP_DEFAULT_LANGUAGE || 'en'): Promise<Playlist | undefined> => {
    if (!id) {
      return undefined;
    }

    const pathname = `/v2/playlists/${id}`;
    const url = createURL(`${env.APP_API_BASE_URL}${pathname}`, params);
    const response = await fetch(url);
    const data = (await getDataOrThrow(response)) as Playlist;

    return this.transformPlaylist(data, language, params.related_media_id);
  };

  getContentList = async ({ id, siteId, language }: { id: string | undefined; siteId: string; language: string }): Promise<Playlist | undefined> => {
    if (!id || !siteId) {
      throw new Error('List ID and Site ID are required');
    }

    const pathname = `/v2/sites/${siteId}/content_lists/${id}`;
    const url = createURL(`${env.APP_API_BASE_URL}${pathname}`, {});
    const response = await fetch(url);
    const data = (await getDataOrThrow(response)) as ContentList;

    return this.transformContentList(data, language);
  };

  getContentSearch = async ({ siteId, params, language }: { siteId: string; params: GetContentSearchParams; language: string }) => {
    const pathname = `/v2/sites/${siteId}/app_content/media/search`;

    const url = createURL(`${env.APP_API_BASE_URL}${pathname}`, {
      search_query: params.searchTerm,
    });

    const response = await fetch(url);
    const data = (await getDataOrThrow(response)) as Playlist;

    return this.transformPlaylist(data, language);
  };
}
