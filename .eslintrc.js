module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'import',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  parserOptions: {
    project: './tsconfig.json',
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {},
    },
  },
  rules: {
    'comma-dangle': ['error',{
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
      functions: 'always-multiline',
    }],
    'eol-last': ['error', 'always'],
    'import/default': 'off',
    'import/extensions': [
      'error', 
      'ignorePackages', {
        'ts': 'never',
        'js': 'never',
      },
    ],
    'import/prefer-default-export': 'off',
    "indent": [
      'error',
      2,
      { 'SwitchCase': 1 },
    ],
    'linebreak-style': 'off',
    'no-trailing-spaces': 'error',
    'semi': ['error', 'always'],
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'variable',
        format: ['camelCase', 'PascalCase', 'snake_case', 'UPPER_CASE'],
      },
      {
        selector: 'function',
        format: ['camelCase', 'PascalCase'],
      },
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
    ],
    '@typescript-eslint/no-redeclare': 'off',
    '@typescript-eslint/no-use-before-define': [
      'error',{
        'functions': false,
      },
    ],
    '@typescript-eslint/no-unused-vars': [
      'error', {
        destructuredArrayIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }
    ],
  },
};
