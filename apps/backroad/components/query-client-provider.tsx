'use client';

import { ReactNode, useState } from 'react';
import {
  QueryClient,
  QueryClientProvider as BaseProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export function QueryClientProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <BaseProvider client={client}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    </BaseProvider>
  );
}
