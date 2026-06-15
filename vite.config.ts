import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    cssTarget: 'chrome61',
    outDir: 'dist',
    sourcemap: true
  }
});
