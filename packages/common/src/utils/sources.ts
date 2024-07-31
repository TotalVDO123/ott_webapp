import type { PlaylistItem, Source } from '@jwp/ott-common/types/playlist';
import type { Config } from '@jwp/ott-common/types/config';
import type { Customer } from '@jwp/ott-common/types/account';

const isVODManifestType = (sourceUrl: string, baseUrl: string, mediaId: string, extensions: ('m3u8' | 'mpd')[]) => {
  return extensions.some((ext) => sourceUrl === `${baseUrl}/manifests/${mediaId}.${ext}`);
};

const isBCLManifestType = (sourceUrl: string, baseUrl: string, mediaId: string, extensions: ('m3u8' | 'mpd')[]) => {
  return extensions.some((ext) => sourceUrl === `${baseUrl}/live/broadcast/${mediaId}.${ext}`);
};

export const getSources = ({ item, baseUrl, config, user }: { item: PlaylistItem; baseUrl: string; config: Config; user: Customer | null }) => {
  const { sources, mediaid } = item;
  const { adConfig, siteId, adDeliveryMethod } = config;

  const userId = user?.id;
  const hasServerAds = !!adConfig && adDeliveryMethod === 'ssai';

  return sources.map((source: Source) => {
    const url = new URL(source.file);

    const sourceUrl = url.href;

    const isBCLManifest = isBCLManifestType(sourceUrl, baseUrl, mediaid, ['m3u8', 'mpd']);
    const isVODManifest = isVODManifestType(sourceUrl, baseUrl, mediaid, ['m3u8', 'mpd']);
    const isDRM = url.searchParams.has('exp') && url.searchParams.has('sig');

    // Use SSAI URL for configs with server side ads, DRM is not supported
    if (isVODManifest && hasServerAds && !isDRM) {
      // Only HLS is supported now
      url.href = `${baseUrl}/v2/sites/${siteId}/media/${mediaid}/ssai.m3u8`;
      url.searchParams.set('ad_config_id', adConfig);
      // Attach user_id only for VOD and BCL SaaS Live Streams (doesn't work with SSAI items)
    } else if ((isVODManifest || isBCLManifest) && userId) {
      url.searchParams.set('user_id', userId);
    }

    source.file = url.toString();

    return source;
  });
};
