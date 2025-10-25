"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <h2 className="text-2xl font-semibold text-white">Something went wrong</h2>
      <p className="max-w-md text-sm text-slate-400">
        The Prism Console couldn’t load the latest system state. Try again in a few seconds or review the platform status page.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-400"
      >
        Retry
      </button>
    </div>
  );
}
