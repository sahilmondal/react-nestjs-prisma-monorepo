import baseConfig from '@workspace/eslint-config/base.js';

export default [
  ...baseConfig,
  {
    ignores: ['dist', 'node_modules'],
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
  },
];
