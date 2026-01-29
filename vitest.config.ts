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

    environment: 'node',

    include: ['src/**/*.test.ts'],
    exclude: ['dist', 'node_modules', 'src/schemas'],

    globals: true,

    pool: 'threads',

    typecheck: {
      enabled: true,
    },
  },
});
