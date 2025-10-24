import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@chat-sdk': resolve(__dirname, '../../packages/chat-sdk/src/client.ts'),
      '@blackroad/chat-sdk': resolve(__dirname, '../../packages/chat-sdk/src/client.ts'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index:  resolve(__dirname, 'index.html'),
        portal: resolve(__dirname, 'portal.html'),
      },
    },
  },
  server: { host: true },
})
