import type { FC, ReactNode } from 'react';
import classNames from 'classnames';

import styles from './Button.module.scss';

type ButtonGroupProps = {
  children?: ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

const ButtonGroup: FC<ButtonGroupProps> = ({ children, className, ...props }) => (
  <div className={classNames(styles.buttonGroup, className)} {...props}>
    {children}
  </div>
);

export default ButtonGroup;
