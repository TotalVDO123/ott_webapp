import React from 'react';
import useBreakpoint, { Breakpoint } from '@jwp/ott-ui-react/src/hooks/useBreakpoint';
import classNames from 'classnames';

import CollapsibleText from '../CollapsibleText/CollapsibleText';

import styles from './TruncatedText.module.scss';

type TruncatedTextProps = {
  text: string;
  maximumLines: number;
  className?: string;
};

const TruncatedText: React.FC<TruncatedTextProps> = ({ text, maximumLines, className }) => {
  const breakpoint: Breakpoint = useBreakpoint();
  const isMobile = breakpoint === Breakpoint.xs;

  if (isMobile) {
    return <CollapsibleText text={text} className={className} />;
  }

  return (
    <div
      className={classNames(styles.truncatedText, className)}
      style={{
        maxHeight: `calc(1.5em * ${maximumLines})`,
        WebkitLineClamp: maximumLines,
      }}
    >
      {text}
    </div>
  );
};

export default TruncatedText;
