import React, { type MouseEventHandler } from 'react';
import classNames from 'classnames';
import { NavLink } from 'react-router-dom';

import Spinner from '../Spinner/Spinner';

import styles from './Button.module.scss';

type Color = 'default' | 'primary' | 'delete';

type Variant = 'contained' | 'outlined' | 'text' | 'danger' | 'delete';

type Props = {
  children?: React.ReactNode;
  label: string;
  active?: boolean;
  color?: Color;
  fullWidth?: boolean;
  startIcon?: React.ReactElement;
  variant?: Variant;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  tabIndex?: number;
  size?: 'small' | 'medium' | 'large';
  to?: string;
  role?: string;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  busy?: boolean;
  id?: string;
  activeClassname?: string;
  navLinkState?: any;
} & React.AriaAttributes;

const Button: React.FC<Props> = ({
  label,
  children,
  color = 'default',
  startIcon,
  fullWidth = false,
  active = false,
  variant = 'outlined',
  size = 'medium',
  disabled,
  busy,
  type = 'button',
  to,
  onClick,
  className,
  activeClassname = '',
  navLinkState,
  ...rest
}: Props) => {
  const buttonClassName = (isActive: boolean) =>
    classNames(styles.button, className, styles[color], styles[variant], {
      [styles.active]: isActive,
      [activeClassname]: isActive,
      [styles.fullWidth]: fullWidth,
      [styles.large]: size === 'large',
      [styles.small]: size === 'small',
      [styles.disabled]: disabled,
    });

  const content = (
    <>
      {startIcon && <div className={styles.startIcon}>{startIcon}</div>}
      {<span className={classNames({ [styles.hidden]: busy }) || undefined}>{label}</span>}
      {children}
      {busy && <Spinner className={styles.centerAbsolute} size={'small'} />}
    </>
  );

  if (to) {
    return (
      <NavLink className={({ isActive }) => buttonClassName(isActive)} to={to} state={navLinkState} {...rest} end>
        {content}
      </NavLink>
    );
  }

  return (
    <button className={buttonClassName(active)} onClick={disabled ? undefined : onClick} type={type} aria-disabled={disabled} {...rest}>
      {content}
    </button>
  );
};
export default Button;
