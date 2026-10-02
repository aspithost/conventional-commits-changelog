import { createVitestConfig as createDefaultVitestConfig } from '@abelspithost/vitest-config';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  createDefaultVitestConfig(),
  defineConfig({
    test: {
      coverage: {
        exclude: [
          '**/schemas/**',
        ],
      },
    },
  }),
);
