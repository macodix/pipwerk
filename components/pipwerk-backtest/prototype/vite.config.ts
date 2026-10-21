import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The prototype is built to build/ and afterwards inlined into one HTML file
// (scripts/inline.mjs), which runs from file:// without a server.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'build',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    modulePreload: false,
  },
  server: { fs: { allow: ['../../..'] } },
});
