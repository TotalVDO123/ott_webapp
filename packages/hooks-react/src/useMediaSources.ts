import { useMemo } from 'react';
import { useConfigStore } from '@jwp/ott-common/src/stores/ConfigStore';
import { useAccountStore } from '@jwp/ott-common/src/stores/AccountStore';
import type { PlaylistItem, Source } from '@jwp/ott-common/types/playlist';
import { getSources } from '@jwp/ott-common/src/utils/sources';

/** Modify manifest URLs to handle server ads and analytics params */
export const useMediaSources = ({ item, baseUrl }: { item: PlaylistItem; baseUrl: string }): Source[] => {
  const config = useConfigStore((s) => s.config);
  const user = useAccountStore((s) => s.user);

  return useMemo(() => getSources({ item, baseUrl, config, user }), [item, baseUrl, config, user]);
};
