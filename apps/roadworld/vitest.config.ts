import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const resolvePath = (dir: string) => path.resolve(__dirname, dir);

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
  resolve: {
    alias: {
      '@/shared': resolvePath('src/shared'),
      '@/state': resolvePath('src/state'),
      '@/scene': resolvePath('src/scene'),
      '@/ui': resolvePath('src/ui'),
      '@/lib': resolvePath('src/lib'),
    },
  },
});
