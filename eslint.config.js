const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  {
    ignores: ['.expo/**', 'dist/**', 'android/**', 'ios/**', 'node_modules/**', 'coverage/**'],
  },
  expoConfig,
  {
    // Data-loading effects intentionally call async helpers that update state.
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);
