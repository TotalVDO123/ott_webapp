import React, { useCallback, useEffect, useRef, useState, type CSSProperties, type TransitionEventHandler } from 'react';
import type { Playlist } from '@jwp/ott-common/types/playlist';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import ChevronLeft from '@jwp/ott-theme/assets/icons/chevron_left.svg?react';
import ChevronRight from '@jwp/ott-theme/assets/icons/chevron_right.svg?react';

import { useScrolledDown } from '../../hooks/useScrolledDown';
import Icon from '../Icon/Icon';
import useBreakpoint, { Breakpoint } from '../../hooks/useBreakpoint';

import styles from './HeroShelf.module.scss';
import HeroShelfMetadata from './HeroShelfMetadata';
import HeroShelfBackground from './HeroShelfBackground';
import HeroShelfPagination from './HeroShelfPagination';
import HeroShelfMetadataMobile from './HeroShelfMetadataMobile';

type Props = {
  playlist: Playlist;
  loading?: boolean;
  error?: unknown;
};

const HeroShelf = ({ playlist, loading = false, error = null }: Props) => {
  const [index, setIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(0);
  const { t } = useTranslation('common');
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint <= Breakpoint.sm;
  const posterRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [animationPhase, setAnimationPhase] = useState<'init' | 'start' | 'end' | null>(null);

  useScrolledDown(50, isMobile ? 200 : 700, (progress: number) => {
    if (posterRef.current) posterRef.current.style.opacity = `${Math.max(1 - progress, isMobile ? 0 : 0.1)}`;
  });

  const slideTo = (toIndex: number) => {
    if (animationPhase) return;

    setNextIndex(toIndex);
    setDirection(toIndex > index ? 'right' : 'left');
    setAnimationPhase('init');
  };

  const slideLeft = () => slideTo(index - 1);
  const slideRight = () => slideTo(index + 1);

  const handleBackgroundAnimationEnd: TransitionEventHandler = useCallback(
    (event) => {
      // Transform has the longest transition (after opacity)
      if (event.propertyName === 'transform' && animationPhase === 'start') {
        setAnimationPhase('end');
      }
    },
    [animationPhase],
  );

  useEffect(() => {
    if (!direction) return;
    if (animationPhase === 'init') {
      setAnimationPhase('start');
      return;
    }
    if (animationPhase === 'end') {
      setIndex(nextIndex);
      setDirection(null);
      setAnimationPhase(null);
    }
  }, [animationPhase, direction, nextIndex]);

  const isAnimating = animationPhase === 'start' || animationPhase === 'end';
  const directionFactor = direction === 'left' ? 1 : direction === 'right' ? -1 : 0;

  // Background animation
  const backgroundX = isMobile ? 10 : 40;
  const backgroundCurrentStyle: CSSProperties = {
    transform: `scale(1.2) translateX(${isAnimating ? backgroundX * directionFactor : 0}px)`,
    opacity: isAnimating ? 0 : 1,
    transition: isAnimating ? `opacity ${isMobile ? 0.3 : 0.1}s ease-out, transform 0.3s ease-in` : 'none',
  };
  const backgroundAltStyle: CSSProperties = {
    transform: `scale(1.2) translateX(${animationPhase === 'init' ? backgroundX * directionFactor * -1 : 0}px)`,
    opacity: isAnimating ? 1 : 0,
    transition: isAnimating ? 'opacity 0.3s ease-out, transform 0.3s ease-out' : 'none',
  };

  // Metadata animation
  const left = 60;
  const metadataCurrentStyle: CSSProperties = {
    left: isAnimating && direction ? left * directionFactor : 0,
    opacity: isAnimating ? 0 : 1,
    transition: isAnimating ? 'opacity 0.15s ease-out, left 0.15s ease-out' : 'none',
    pointerEvents: isAnimating ? 'none' : 'initial',
  };

  const metadataAltStyle: CSSProperties = {
    left: animationPhase === 'init' ? left * directionFactor * -1 : 0,
    opacity: isAnimating ? 1 : 0,
    transition: isAnimating ? 'opacity 0.2s ease-out, left 0.2s ease-out' : 'none',
    pointerEvents: 'none',
  };

  const item = playlist.playlist[index];
  const leftItem = playlist.playlist[nextIndex < index ? nextIndex : index - 1] || null;
  const rightItem = playlist.playlist[nextIndex > index ? nextIndex : index + 1] || null;

  const renderedItem = animationPhase !== 'end' ? item : direction === 'right' ? leftItem : rightItem;
  const altItem = direction === 'right' ? rightItem : leftItem;

  if (error || !playlist?.playlist) return <h2 className={styles.error}>Could not load items</h2>;

  return (
    <div className={classNames(styles.shelf)}>
      <div className={styles.poster} ref={posterRef}>
        <div className={styles.background} id="background">
          <HeroShelfBackground
            item={leftItem}
            style={backgroundAltStyle}
            key={renderedItem?.mediaid === leftItem?.mediaid ? 'left-item' : leftItem?.mediaid}
            hidden={direction !== 'left'}
          />
          <HeroShelfBackground item={renderedItem} style={backgroundCurrentStyle} key={renderedItem?.mediaid} onTransitionEnd={handleBackgroundAnimationEnd} />
          <HeroShelfBackground
            item={rightItem}
            style={backgroundAltStyle}
            key={renderedItem?.mediaid === rightItem?.mediaid ? 'right-item' : rightItem?.mediaid}
            hidden={direction !== 'right'}
          />
          <div className={styles.fade} />
        </div>
        <div className={styles.fade2} />
      </div>
      <button
        className={classNames(styles.chevron, styles.chevronLeft)}
        aria-label={t('slide_previous')}
        disabled={!leftItem}
        onClick={leftItem ? slideLeft : undefined}
      >
        <Icon icon={ChevronLeft} />
      </button>
      {isMobile ? (
        <HeroShelfMetadataMobile
          loading={loading}
          item={item}
          rightItem={rightItem}
          leftItem={leftItem}
          playlistId={playlist.feedid}
          direction={direction}
          onSlideLeft={slideLeft}
          onSlideRight={slideRight}
        />
      ) : (
        <>
          <HeroShelfMetadata item={renderedItem} loading={loading} playlistId={playlist.feedid} style={metadataCurrentStyle} />
          <HeroShelfMetadata item={altItem} loading={loading} playlistId={playlist.feedid} style={metadataAltStyle} hidden={!direction} />
        </>
      )}
      <button
        className={classNames(styles.chevron, styles.chevronRight)}
        aria-label={t('slide_next')}
        disabled={!rightItem}
        onClick={rightItem ? slideRight : undefined}
      >
        <Icon icon={ChevronRight} />
      </button>
      <HeroShelfPagination playlist={playlist} index={index} setIndex={slideTo} nextIndex={nextIndex} direction={direction || false} />
    </div>
  );
};

export default HeroShelf;
