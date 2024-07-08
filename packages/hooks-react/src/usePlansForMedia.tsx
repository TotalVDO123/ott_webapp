import { useQuery, useQueryClient } from 'react-query';
import { useEffect, useMemo } from 'react';
import { getModule } from '@jwp/ott-common/src/modules/container';
import CheckoutController from '@jwp/ott-common/src/controllers/CheckoutController';
import type { PlaylistItem } from '@jwp/ott-common/types/playlist';
import { MediaStatus } from '@jwp/ott-common/src/utils/liveEvent';
import { useCheckoutStore } from '@jwp/ott-common/src/stores/CheckoutStore';

import useMedia from './useMedia';

const buildFilterQuery = (tags?: string[], customParams?: ({ key: string; value: unknown } | null)[]): string => {
  const query: string[] = [];

  if (tags?.length) {
    query.push(`(tags:("${tags.join('" OR "')}"))`);
    query.push(`tags:(NOT("${tags.join('" AND "')}"))`);
  }

  if (customParams?.length) {
    const validCustomParams = customParams.filter((cp) => cp?.key !== '' && cp?.value !== '') as { key: string; value: string }[];

    if (validCustomParams.length) {
      const customParamsQuery = validCustomParams.map((cp) => `custom_parameters:(name:"${cp.key}" AND value:"${cp.value}")`).join(' OR ');

      const customParamsNotQuery = validCustomParams.map((cp) => `custom_parameters:(NOT(name:"${cp.key}" AND value:"${cp.value}"))`).join(' AND ');

      query.push(`(${customParamsQuery})`);
      query.push(customParamsNotQuery);
    }
  }

  return query.join(' AND ');
};

// we need this sample object to keep track of the keys we want to extract from the playlist item
// values are not important here, they're just to make the object valid
const samplePlaylistItem: PlaylistItem = {
  description: 'description',
  duration: 0,
  feedid: 'feedid',
  image: 'image',
  images: [],
  link: 'link',
  mediaid: 'mediaid',
  pubdate: 0,
  sources: [],
  title: 'title',

  // optional keys, but we need to include them in the object
  cardImage: 'cardImage',
  backgroundImage: 'backgroundImage',
  channelLogoImage: 'channelLogoImage',
  genre: 'genre',
  rating: 'rating',
  requiresSubscription: 'requiresSubscription',
  seriesId: 'seriesId',
  episodeNumber: 'episodeNumber',
  seasonNumber: 'seasonNumber',
  tags: '',
  trailerId: 'trailerId',
  tracks: [],
  variations: {},
  free: 'free',
  productIds: 'productIds',
  mediaOffers: [],
  contentType: 'contentType',
  liveChannelsId: 'liveChannelsId',
  scheduleUrl: 'scheduleUrl',
  scheduleToken: 'scheduleToken',
  scheduleDataFormat: 'scheduleDataFormat',
  scheduleDemo: 'scheduleDemo',
  catchupHours: 'catchupHours',
  mediaStatus: MediaStatus.VOD,
  scheduledStart: new Date(),
  scheduledEnd: new Date(),
  markdown: 'markdown',
  scheduleType: 'scheduleType',
};

const extractCustomParameters = (playlistItem: PlaylistItem): { key: string; value: unknown }[] => {
  const excludedKeys = Object.keys(samplePlaylistItem);
  return Object.entries(playlistItem)
    .filter(([key]) => !excludedKeys.includes(key))
    .map(([key, value]) => ({ key, value }));
};

export default function usePlansForMedia(mediaId: string) {
  const queryClient = useQueryClient();

  const accessMethod = useCheckoutStore(({ accessMethod }) => accessMethod);

  const checkoutController = getModule(CheckoutController);

  const { isLoading: isMediaLoading, data: mediaData } = useMedia(mediaId, accessMethod === 'plan');

  const { isLoading: isPlansLoading, data } = useQuery({
    queryKey: ['plans', mediaData?.mediaid],
    queryFn: async () => {
      if (!mediaData) {
        return;
      }

      const tags = mediaData.tags ? mediaData.tags.split(',') : [];
      const customParameters = extractCustomParameters(mediaData);

      const searchString = `q=${buildFilterQuery(tags, customParameters)}`;

      return await checkoutController.getPlansWithPriceOffers(searchString);
    },
    enabled: !!checkoutController && !!mediaData,
  });

  const isLoading = isMediaLoading || isPlansLoading;

  useEffect(
    () => () => {
      queryClient.invalidateQueries(['plans', mediaId]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return useMemo(() => ({ isLoading, data }), [isLoading, data]);
}
