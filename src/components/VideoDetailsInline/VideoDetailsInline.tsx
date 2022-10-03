import React from 'react';
import { useTranslation } from 'react-i18next';

import Tag from '../Tag/Tag';

import styles from './VideoDetailsInline.module.scss';

import CollapsibleText from '#src/components/CollapsibleText/CollapsibleText';
import useBreakpoint, { Breakpoint } from '#src/hooks/useBreakpoint';

type Props = {
  title: string | React.ReactNode;
  description: string;
  primaryMetadata: React.ReactNode;
  shareButton: React.ReactNode;
  favoriteButton: React.ReactNode;
  trailerButton: React.ReactNode;
  live?: boolean;
};

const VideoDetailsInline: React.FC<Props> = ({ title, description, primaryMetadata, shareButton, favoriteButton, trailerButton, live }) => {
  const { t } = useTranslation('common');
  const breakpoint: Breakpoint = useBreakpoint();
  const isMobile = breakpoint === Breakpoint.xs;

  const TitleComponent = typeof title === 'string' ? 'h2' : 'div';

  return (
    <div className={styles.details} data-testid="video-details-inline">
      <TitleComponent className={styles.title}>{title}</TitleComponent>
      <div className={styles.inlinePlayerMetadata}>
        <div className={styles.primaryMetadata}>
          {live && (
            <Tag className={styles.live} isLive>
              {t('live')}
            </Tag>
          )}
          {primaryMetadata}
        </div>
        {trailerButton}
        {favoriteButton}
        {shareButton}
      </div>
      <CollapsibleText text={description} className={styles.description} maxHeight={isMobile ? 60 : 'none'} />
    </div>
  );
};

export default VideoDetailsInline;
