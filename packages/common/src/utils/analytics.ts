import { useAccountStore } from '../stores/AccountStore';
import type { PlaylistItem, Source } from '../../types/playlist';

export const attachAnalyticsParams = (item: PlaylistItem) => {
  // @todo pass these as params instead of reading the stores
  const { user } = useAccountStore.getState();

  const { sources, mediaid } = item;

  const userId = user?.id;

  sources.map((source: Source) => {
    const url = new URL(source.file);

    const mediaId = mediaid.toLowerCase();
    const sourceUrl = url.href.toLowerCase();

    // Attach user_id only for VOD and BCL SaaS Live Streams
    const isVOD = sourceUrl === `https://cdn.jwplayer.com/manifests/${mediaId}.m3u8`;
    const isBCL = sourceUrl === `https://content.jwplatform.com/live/broadcast/${mediaId}.m3u8`;

    if ((isVOD || isBCL) && userId) {
      url.searchParams.set('user_id', userId);
    }

    source.file = url.toString();
  });
};
