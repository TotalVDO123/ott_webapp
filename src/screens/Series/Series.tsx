import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import shallow from 'zustand/shallow';

import VideoLayout from '#src/components/VideoLayout/VideoLayout';
import InlinePlayer from '#src/containers/InlinePlayer/InlinePlayer';
import { isLocked } from '#src/utils/entitlements';
import useEntitlement from '#src/hooks/useEntitlement';
import useBlurImageUpdater from '#src/hooks/useBlurImageUpdater';
import { episodeURL, episodeURLFromEpisode, formatSeriesMetaString, formatVideoMetaString } from '#src/utils/formatting';
import useMedia from '#src/hooks/useMedia';
import { useSeriesData } from '#src/hooks/useSeriesData';
import ErrorPage from '#src/components/ErrorPage/ErrorPage';
import { generateEpisodeJSONLD } from '#src/utils/structuredData';
import { enrichMediaItems, filterSeries, getFiltersFromSeries, getNextItemId } from '#src/utils/series';
import LoadingOverlay from '#src/components/LoadingOverlay/LoadingOverlay';
import { useWatchHistoryStore } from '#src/stores/WatchHistoryStore';
import { useConfigStore } from '#src/stores/ConfigStore';
import { useAccountStore } from '#src/stores/AccountStore';
import StartWatchingButton from '#src/containers/StartWatchingButton/StartWatchingButton';
import { getSeriesIdFromEpisode } from '#src/utils/media';
import useBreakpoint, { Breakpoint } from '#src/hooks/useBreakpoint';
import Cinema from '#src/containers/Cinema/Cinema';
import TrailerModal from '#src/containers/TrailerModal/TrailerModal';
import ShareButton from '#src/components/ShareButton/ShareButton';
import FavoriteButton from '#src/containers/FavoriteButton/FavoriteButton';
import Button from '#src/components/Button/Button';
import PlayTrailer from '#src/icons/PlayTrailer';
import type { PlaylistItem } from '#types/playlist';

const Series = (): JSX.Element => {
  const breakpoint = useBreakpoint();
  const { t } = useTranslation('video');
  const [playTrailer, setPlayTrailer] = useState<boolean>(false);

  // Routing
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const id = params.id || '';
  const episodeId = searchParams.get('e') || '';
  const play = searchParams.get('play') === '1';
  const feedId = searchParams.get('l');

  // Config
  const { config, accessModel } = useConfigStore(({ config, accessModel }) => ({ config, accessModel }), shallow);
  const { styling, features, siteName, custom } = config;
  const posterFading: boolean = styling?.posterFading === true;
  const enableSharing: boolean = features?.enableSharing === true;
  const isFavoritesEnabled: boolean = Boolean(features?.favoritesList);
  const inlineLayout = Boolean(custom?.inlinePlayer);

  // Media
  const {
    isLoading: isPlaylistLoading,
    isPlaylistError,
    data: { series, seriesPlaylist },
  } = useSeriesData(id);
  const { data: rawItem, isLoading: isEpisodeLoading, isError: isItemError } = useMedia(episodeId);
  const { isLoading: isTrailerLoading, data: trailerItem } = useMedia(rawItem?.trailerId || '');

  const item = series && rawItem ? enrichMediaItems(series, [rawItem])[0] : rawItem;
  const nextItemId = getNextItemId(item, series, seriesPlaylist);

  const seriesId = getSeriesIdFromEpisode(item);
  const isLoading = isPlaylistLoading || isEpisodeLoading;

  const [seasonFilter, setSeasonFilter] = useState<string>(item?.seasonNumber || '1');
  const filters = getFiltersFromSeries(seriesPlaylist);
  const filteredPlaylist = useMemo(() => filterSeries(seriesPlaylist, seasonFilter), [seriesPlaylist, seasonFilter]);

  // Watch history
  const watchHistoryDictionary = useWatchHistoryStore((state) => state.getDictionary());

  // User, entitlement
  const { user, subscription } = useAccountStore(({ user, subscription }) => ({ user, subscription }), shallow);
  const { isEntitled } = useEntitlement(item);

  useBlurImageUpdater(item);

  // Handlers
  const goBack = () => item && seriesPlaylist && navigate(episodeURL(seriesPlaylist, item.mediaid, false));
  const onCardClick = (item: PlaylistItem) => seriesPlaylist && navigate(episodeURL(seriesPlaylist, item.mediaid));

  const handleComplete = useCallback(() => {
    if (nextItemId) {
      navigate(episodeURL(seriesPlaylist, nextItemId, true));
    }
  }, [navigate, nextItemId, seriesPlaylist]);

  // Effects
  useEffect(() => {
    (document.scrollingElement || document.body).scroll({ top: 0, behavior: 'smooth' });
  }, [episodeId]);

  useEffect(() => {
    if (!searchParams.has('e') && seriesPlaylist?.playlist.length) {
      navigate(episodeURL(seriesPlaylist, seriesPlaylist.playlist[0].mediaid), { replace: true });
    }
  }, [navigate, searchParams, seriesPlaylist]);

  useEffect(() => {
    setSeasonFilter(item?.seasonNumber || '');
  }, [item?.seasonNumber, setSeasonFilter]);

  // UI
  if (isLoading) return <LoadingOverlay />;
  if ((!isLoading && isItemError) || !item) return <ErrorPage title={t('episode_not_found')} />;
  if (isPlaylistError) return <ErrorPage title={t('series_error')} />;
  if (!seriesId) return <ErrorPage title={t('series_error')} />;

  const pageTitle = `${item.title} - ${siteName}`;
  const canonicalUrl = seriesPlaylist && item ? `${window.location.origin}${episodeURL(seriesPlaylist, item.mediaid)}` : window.location.href;

  const primaryMetadata = formatVideoMetaString(item, t('video:total_episodes', { count: seriesPlaylist.playlist.length }));
  const secondaryMetadata = (
    <>
      <strong>{formatSeriesMetaString(item.seasonNumber || '1', item.episodeNumber || '1')}</strong> - {item.title}
    </>
  );
  const episodesInSeason = seriesPlaylist.playlist.filter((i) => i.seasonNumber === item.seasonNumber).length;
  const filterMetadata = ` ${t('video:season')} ${item.seasonNumber}/${filters.length} - ${t('video:episode')} ${item.episodeNumber}/${episodesInSeason}`;

  const shareButton = enableSharing && <ShareButton title={item.title} description={item.description} url={canonicalUrl} />;
  const startWatchingButton = <StartWatchingButton item={item} playUrl={episodeURLFromEpisode(item, seriesId, feedId, true)} />;

  const favoriteButton = isFavoritesEnabled && <FavoriteButton item={item} />;
  const trailerButton = (!!trailerItem || isTrailerLoading) && (
    <Button
      label={t('video:trailer')}
      aria-label={t('video:watch_trailer')}
      startIcon={<PlayTrailer />}
      onClick={() => setPlayTrailer(true)}
      active={playTrailer}
      fullWidth={breakpoint < Breakpoint.md}
      disabled={!trailerItem}
    />
  );

  const isLoggedIn = !!user;
  const hasSubscription = !!subscription;

  return (
    <React.Fragment>
      <Helmet>
        <title>{pageTitle}</title>
        <link rel="canonical" href={canonicalUrl} />
        <meta name="description" content={item.description} />
        <meta property="og:description" content={item.description} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:type" content="video.episode" />
        {item.image && <meta property="og:image" content={item.image?.replace(/^https:/, 'http:')} />}
        {item.image && <meta property="og:image:secure_url" content={item.image?.replace(/^http:/, 'https:')} />}
        <meta property="og:image:width" content={item.image ? '720' : ''} />
        <meta property="og:image:height" content={item.image ? '406' : ''} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={item.description} />
        <meta name="twitter:image" content={item.image} />
        <meta property="og:video" content={canonicalUrl.replace(/^https:/, 'http:')} />
        <meta property="og:video:secure_url" content={canonicalUrl.replace(/^http:/, 'https:')} />
        <meta property="og:video:type" content="text/html" />
        <meta property="og:video:width" content="1280" />
        <meta property="og:video:height" content="720" />
        {item.tags?.split(',').map((tag) => (
          <meta property="og:video:tag" content={tag} key={tag} />
        ))}
        {seriesPlaylist && item ? <script type="application/ld+json">{generateEpisodeJSONLD(seriesPlaylist, item)}</script> : null}
      </Helmet>
      <VideoLayout
        item={item}
        title={item.title}
        description={item.description}
        inlineLayout={inlineLayout}
        primaryMetadata={primaryMetadata}
        secondaryMetadata={secondaryMetadata}
        image={item.backgroundImage}
        shareButton={shareButton}
        favoriteButton={favoriteButton}
        trailerButton={trailerButton}
        posterMode={posterFading ? 'fading' : 'normal'}
        startWatchingButton={startWatchingButton}
        isLoading={isLoading}
        accessModel={accessModel}
        isLoggedIn={isLoggedIn}
        hasSubscription={hasSubscription}
        playlist={filteredPlaylist}
        relatedTitle={seriesPlaylist.title}
        onItemClick={onCardClick}
        enableCardTitles={styling.shelfTitles}
        setFilter={setSeasonFilter}
        currentFilter={seasonFilter}
        filterValuePrefix={t('season_prefix')}
        defaultFilterLabel={t('all_seasons')}
        activeLabel={t('current_episode')}
        watchHistory={watchHistoryDictionary}
        filterMetadata={filterMetadata}
        filters={filters}
        player={
          inlineLayout ? (
            <InlinePlayer
              isLoggedIn={isLoggedIn}
              item={item}
              onComplete={handleComplete}
              feedId={feedId ?? undefined}
              startWatchingButton={startWatchingButton}
              paywall={isLocked(accessModel, isLoggedIn, hasSubscription, item)}
            />
          ) : (
            <Cinema
              open={play && isEntitled}
              onClose={goBack}
              item={item}
              title={seriesPlaylist.title}
              primaryMetadata={primaryMetadata}
              secondaryMetadata={secondaryMetadata}
              onComplete={handleComplete}
              feedId={feedId ?? undefined}
            />
          )
        }
      />
      <TrailerModal item={trailerItem} title={`${item.title} - Trailer`} open={playTrailer} onClose={() => setPlayTrailer(false)} />
    </React.Fragment>
  );
};

export default Series;
