import React, { useRef, type PropsWithChildren } from 'react';

import Image from '../Image/Image';
import { useScrolledDown } from '../../hooks/useScrolledDown';
import useBreakpoint, { Breakpoint } from '../../hooks/useBreakpoint';

import styles from './Hero.module.scss';

type Props = PropsWithChildren<{
  image?: string;
}>;

const Hero = ({ image, children }: Props) => {
  const alt = ''; // intentionally empty for a11y, because adjacent text alternative
  const posterRef = useRef<HTMLImageElement>(null);
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint <= Breakpoint.sm;

  useScrolledDown(50, isMobile ? 150 : 500, (progress: number) => {
    if (posterRef.current) posterRef.current.style.opacity = `${Math.max(1 - progress, 0.1)}`;
  });

  return (
    <div className={styles.hero}>
      <Image ref={posterRef} className={styles.poster} image={image} width={1280} alt={alt} />
      <div className={styles.posterFade} />
      <div className={styles.info}>{children}</div>
    </div>
  );
};

export default Hero;
