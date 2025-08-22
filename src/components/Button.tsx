import React from 'react';
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type State = 'idle' | 'loading' | 'success' | 'error';

const base =
  'inline-flex items-center justify-center select-none rounded-md focus-visible:outline-none focus-ring transition';

const byVariant: Record<Variant, string> = {
  primary:   'bg-[var(--accent)] text-black hover:bg-[var(--accent-strong)]',
  secondary: 'bg-[var(--bg-elev-2)] text-[var(--text)] hover:bg-[var(--bg-elev-1)] border border-[var(--border)]',
  ghost:     'bg-transparent text-[var(--text)] hover:bg-[var(--bg-elev-2)]',
  danger:    'bg-[var(--danger)] text-white hover:brightness-110'
};

const bySize: Record<Size, string> = {
  xs: 'h-7 px-2 text-xs', sm: 'h-8 px-3 text-sm', md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base', xl: 'h-14 px-6 text-lg'
};

export function Button({
  children, variant = 'primary', size = 'md', state = 'idle', ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; state?: State }) {
  const cls = [base, byVariant[variant], bySize[size]].join(' ');
  return (
    <button className={cls} data-state={state} {...props}>
      {children}
    </button>
  );
}
