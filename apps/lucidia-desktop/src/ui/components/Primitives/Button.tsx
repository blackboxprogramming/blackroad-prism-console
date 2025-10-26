import { ButtonHTMLAttributes } from 'react';
import clsx from 'classnames';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'lucidia-button',
        `lucidia-button-${variant}`,
        className
      )}
      {...props}
    />
  );
}
