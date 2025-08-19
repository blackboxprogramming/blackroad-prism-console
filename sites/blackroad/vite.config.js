import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: { jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment' },
  build: { outDir: 'dist' },
export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  base: '/',
});
