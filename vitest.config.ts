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
      thresholds: {
        branches: 90,
        functions: 95,
        lines: 95,
      },
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
