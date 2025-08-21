import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config for the static BlackRoad site.
// NGINX/Caddy in the repo will serve the built /dist at runtime.
export default defineConfig({
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'dist',
    sourcemap: false,
    emptyOutDir: true,
  },
  server: {
    host: true,
  },
});
