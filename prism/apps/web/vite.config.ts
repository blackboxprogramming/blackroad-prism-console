import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/events': 'http://localhost:4000',
      '/diffs': 'http://localhost:4000',
      '/policy': 'http://localhost:4000'
    }
  }
});
