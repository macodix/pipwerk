import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Address of the Pipwerk Studio backend that receives the /api requests of the
// development server. It can be changed without editing this file.
const backendUrl = process.env.PIPWERK_STUDIO_BACKEND_URL ?? 'http://127.0.0.1:8000';

const proxy = {
  '/api': { target: backendUrl, changeOrigin: false },
};

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    strictPort: true,
    proxy,
  },
  preview: {
    host: '127.0.0.1',
    strictPort: true,
    proxy,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
