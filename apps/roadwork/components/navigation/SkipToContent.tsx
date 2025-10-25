'use client';

export function SkipToContent() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 rounded bg-brand-500 px-4 py-2 text-white"
    >
      Skip to main content
    </a>
  );
}
