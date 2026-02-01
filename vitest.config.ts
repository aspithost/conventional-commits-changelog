import { join } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': join(process.cwd(), './src'),
    },
  },
  test: {
    clearMocks: true,

    coverage: {
      exclude: ['src/schemas/**'],
    },

    environment: 'node',

    include: ['src/**/*.spec.ts'],
    exclude: ['dist', 'node_modules'],

    globals: true,

    pool: 'threads',

    typecheck: {
      enabled: true,
    },
  },
});
