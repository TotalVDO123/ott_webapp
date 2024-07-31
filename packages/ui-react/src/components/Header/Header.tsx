import React, { type PropsWithChildren } from 'react';
import classNames from 'classnames';

import styles from './Header.module.scss';

type TypeHeader = 'static' | 'fixed';

type Props = {
  headerType?: TypeHeader;
  className?: string;
  searchActive: boolean;
};

const Header = ({ children, className, headerType = 'static', searchActive }: PropsWithChildren<Props>) => {
  const headerClassName = classNames(styles.header, styles[headerType], className, {
    [styles.searchActive]: searchActive,
  });

  return (
    <header className={headerClassName}>
      <div className={styles.container}>{children}</div>
    </header>
  );
};
export default Header;
