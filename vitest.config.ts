// vitest.config.ts
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/__vitest__/setup.ts'],
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    css: true,
    exclude: ['**/e2e-tests/**', '**/node_modules/**'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '#': resolve(__dirname, './'),
      ui: resolve(__dirname, './ui'),
    },
  },
});
