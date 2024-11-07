import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { shallow } from '@jwp/ott-common/src/utils/compare';
import InfiniteScroll from 'react-infinite-scroller';
import type { Content } from '@jwp/ott-common/types/config';
import { useAccountStore } from '@jwp/ott-common/src/stores/AccountStore';
import { useConfigStore } from '@jwp/ott-common/src/stores/ConfigStore';
import { useWatchHistoryStore } from '@jwp/ott-common/src/stores/WatchHistoryStore';
import { slugify } from '@jwp/ott-common/src/utils/urlFormatting';
import { parseAspectRatio, parseTilesDelta } from '@jwp/ott-common/src/utils/collection';
import { isTruthyCustomParamValue, testId } from '@jwp/ott-common/src/utils/common';
import { PersonalShelf } from '@jwp/ott-common/src/constants';
import usePlaylists from '@jwp/ott-hooks-react/src/usePlaylists';

import Shelf from '../../components/Shelf/Shelf';
import InfiniteScrollLoader from '../../components/InfiniteScrollLoader/InfiniteScrollLoader';
import ErrorPage from '../../components/ErrorPage/ErrorPage';
import Fade from '../../components/Animation/Fade/Fade';
import FeaturedShelf from '../../components/FeaturedShelf/FeaturedShelf';

import styles from './ShelfList.module.scss';

const INITIAL_ROWS_TO_LOAD = 6;
const ROWS_TO_LOAD_STEP = 4;

type Props = {
  rows: Content[];
};

const ShelfList = ({ rows }: Props) => {
  const { accessModel } = useConfigStore(({ accessModel }) => ({ accessModel }), shallow);
  const [rowsToLoad, setRowsToLoad] = useState(INITIAL_ROWS_TO_LOAD);
  const { t } = useTranslation('error');
  const { i18n } = useTranslation();

  // Determine currently selected language
  const language = i18n.language;

  const watchHistoryDictionary = useWatchHistoryStore((state) => state.getDictionaryWithSeries());

  // User
  const { user, subscription } = useAccountStore(({ user, subscription }) => ({ user, subscription }), shallow);

  // Todo: move to more common package?

  const playlists = usePlaylists(rows, rowsToLoad);

  useEffect(() => {
    // reset row count when the page changes
    return () => setRowsToLoad(INITIAL_ROWS_TO_LOAD);
  }, [rows]);

  // If all playlists are empty (most probably due to geo restrictions), we show an empty shelves error
  const allPlaylistsEmpty = playlists.every(({ data, isSuccess }) => isSuccess && !data?.playlist?.length);

  if (allPlaylistsEmpty) {
    return <ErrorPage title={t('empty_shelves_heading')} message={t('empty_shelves_description')} />;
  }

  return (
    <div className={styles.shelfList}>
      <InfiniteScroll
        style={{ overflow: 'hidden' }}
        loadMore={() => setRowsToLoad((current) => current + ROWS_TO_LOAD_STEP)}
        hasMore={rowsToLoad < rows.length}
        loader={<InfiniteScrollLoader key="loader" />}
        useWindow={false}
      >
        {rows.slice(0, rowsToLoad).map(({ type, featured, title, custom }, index) => {
          const { data: playlist, isPlaceholderData, error } = playlists[index];

          if (!playlist?.playlist?.length) return null;

          const posterAspect = parseAspectRatio(playlist.cardImageAspectRatio || playlist.shelfImageAspectRatio);
          const visibleTilesDelta = parseTilesDelta(posterAspect);

          const translatedKey = custom?.[`title-${language}`];
          const translatedTitle = translatedKey || title || playlist?.title;

          const isFeatured = isTruthyCustomParamValue(custom?.featured) || featured;

          const ShelfComponent = isFeatured ? FeaturedShelf : Shelf;

          return (
            <section
              key={`${index}_${playlist.id}`}
              className={classNames(styles.shelfContainer, { [styles.featured]: isFeatured })}
              data-testid={testId(`shelf-${isFeatured ? 'featured' : type === 'playlist' ? slugify(translatedTitle) : type}`)}
              aria-label={title || playlist?.title}
            >
              <Fade duration={250} delay={index * 33} open>
                <ShelfComponent
                  loading={isPlaceholderData}
                  error={error}
                  type={type}
                  playlist={playlist}
                  watchHistory={type === PersonalShelf.ContinueWatching ? watchHistoryDictionary : undefined}
                  title={translatedTitle}
                  featured={isFeatured}
                  accessModel={accessModel}
                  isLoggedIn={!!user}
                  hasSubscription={!!subscription}
                  posterAspect={posterAspect}
                  visibleTilesDelta={visibleTilesDelta}
                />
              </Fade>
            </section>
          );
        })}
      </InfiniteScroll>
    </div>
  );
};

export default ShelfList;
