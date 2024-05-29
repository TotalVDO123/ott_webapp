import React from 'react';
import { testId } from '@jwp/ott-common/src/utils/common';

import TruncatedText from '../TruncatedText/TruncatedText';

import styles from './VideoDetailsInline.module.scss';

type Props = {
  title: string | React.ReactNode;
  description: string;
  primaryMetadata: React.ReactNode;
  shareButton: React.ReactNode;
  favoriteButton: React.ReactNode;
  trailerButton: React.ReactNode;
  live?: boolean;
};

const VideoDetailsInline: React.FC<Props> = ({ title, description, primaryMetadata, shareButton, favoriteButton, trailerButton }) => {
  const TitleComponent = typeof title === 'string' ? 'h1' : 'div';

  return (
    <div className={styles.details} data-testid={testId('video-details-inline')}>
      <TitleComponent className={styles.title}>{title}</TitleComponent>
      <div className={styles.inlinePlayerMetadata}>
        <div className={styles.primaryMetadata}>{primaryMetadata}</div>
        {trailerButton}
        {favoriteButton}
        {shareButton}
      </div>
      <TruncatedText text={description} maximumLines={20} className={styles.description} />
    </div>
  );
};

export default VideoDetailsInline;
