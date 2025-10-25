'use client';

import { useEffect } from 'react';

export function useA11yChecks(name: string) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'test') return;
    // placeholder for axe integration in tests
    // tests import this hook to ensure consistent signature
    console.debug(`[a11y] Mounted component: ${name}`);
  }, [name]);
}
