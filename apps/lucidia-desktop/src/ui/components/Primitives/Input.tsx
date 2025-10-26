import { forwardRef, InputHTMLAttributes } from 'react';
import clsx from 'classnames';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref
) {
  return <input ref={ref} className={clsx('lucidia-input', className)} {...props} />;
});
