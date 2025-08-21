import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: { jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment' },
  build: { outDir: 'dist' },
  base: '/',
});
