import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'temp/', 'coverage/', 'node_modules/', 'plans/'] },
  js.configs.recommended,
  ...svelte.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['site/**/*.js', 'site/**/*.svelte'],
    ...jsdoc.configs['flat/recommended'],
  },
  {
    files: ['site/**/*.js', 'site/**/*.svelte'],
    rules: {
      'jsdoc/require-jsdoc': ['warn', { publicOnly: true }],
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-returns-description': 'off',
      'jsdoc/require-property-description': 'off',
      'jsdoc/no-undefined-types': 'off',
      'jsdoc/reject-any-type': 'off',
      'jsdoc/reject-function-type': 'off',
    },
  },
  {
    files: ['site/test/**/*.js'],
    rules: Object.fromEntries(Object.keys(jsdoc.rules).map(rule => [`jsdoc/${rule}`, 'off'])),
  },
  {
    // The CV validators match control characters on purpose.
    files: ['src/**/*.mjs'],
    rules: { 'no-control-regex': 'off' },
  },
];
