import type { MediaStatus } from '../src/utils/liveEvent';

import type { MediaOffer } from './media';

export type ContentListItem = {
  media_id: string;
  title: string;
  description: string | null;
  tags: string[];
  duration: number;
  custom_params: {
    cardImage?: string;
    backgroundImage?: string;
    channelLogoImage?: string;
    genre?: string;
    rating?: string;
    requiresSubscription?: string | null;
    seriesId?: string;
    episodeNumber?: string;
    seasonNumber?: string;
    trailerId?: string;
    free?: string;
    productIds?: string;
    mediaOffers?: MediaOffer[] | null;
    contentType?: string;
    liveChannelsId?: string;
    scheduleUrl?: string | null;
    scheduleToken?: string;
    scheduleDataFormat?: string;
    scheduleDemo?: string;
    catchupHours?: string;
    mediaStatus?: MediaStatus;
    scheduledStart?: Date;
    scheduledEnd?: Date;
    markdown?: string;
    scheduleType?: string;
    [key: string]: unknown;
  };
};

export type ContentList = {
  id: string;
  title: string;
  description: string | undefined;
  list: ContentListItem[];
};
