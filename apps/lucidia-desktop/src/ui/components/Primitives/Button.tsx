import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        'rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-surface',
        {
          'bg-sky-500 text-white hover:bg-sky-400': variant === 'primary',
          'bg-slate-700 text-slate-100 hover:bg-slate-600': variant === 'secondary',
          'bg-transparent text-slate-200 hover:bg-slate-800': variant === 'ghost'
        },
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
  )
);

Button.displayName = 'Button';
  );
}
