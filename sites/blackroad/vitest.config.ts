import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/*golden.test.tsx'],
  },
  resolve: {
    alias: {
      '@chat-sdk': resolve(__dirname, '../../packages/chat-sdk/src/client.ts'),
      '@blackroad/chat-sdk': resolve(__dirname, '../../packages/chat-sdk/src/client.ts'),
    },
  },
});
