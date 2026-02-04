import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';

export default defineConfig([
  {
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
    ],
    files: ['src/**/*.{js,ts}'],
    ignores: ['dist/**', 'node_modules/**'],
    plugins: {
      '@stylistic': stylistic,
    },
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
      },
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
      '@typescript-eslint/no-unused-vars': ['error', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
      }],
    },
  },
]);
