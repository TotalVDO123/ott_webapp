import classNames from 'classnames';
import React from 'react';

import TruncatedText from '../TruncatedText/TruncatedText';
import Image from '../Image/Image';

import styles from './Hero.module.scss';

type Props = {
  title: string;
  description: string;
  image?: string;
};

const Hero = ({ title, description, image }: Props) => {
  const alt = ''; // intentionally empty for a11y, because adjacent text alternative

  return (
    <div className={classNames(styles.hero, styles.heroPadding)}>
      <Image className={styles.poster} image={image} width={1280} alt={alt} />
      <div className={styles.posterFade} />
      <div className={styles.info}>
        <h1 className={styles.title}>{title}</h1>
        <TruncatedText text={description} maximumLines={8} className={styles.description} />
      </div>
    </div>
  );
};

export default Hero;
