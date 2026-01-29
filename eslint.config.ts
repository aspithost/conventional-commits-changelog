import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.{js,ts}'],
    plugins: {
      '@stylistic': stylistic,
    },
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      '@stylistic/comma-dangle': ['error', {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'always-multiline',
      }],
      '@stylistic/eol-last': 'error',
      '@stylistic/indent': ['error', 2, { 'SwitchCase': 1 }],
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/semi': 'error',
    },
  },
]);
