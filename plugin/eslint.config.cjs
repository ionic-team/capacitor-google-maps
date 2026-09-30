const ionic = require('@ionic/eslint-config/recommended');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.build/**',
      'unit-tests/**',
      'android/**',
      'ios/**',
      'types/**',
      '**/*.js',
      '**/*.mjs',
      '**/*.cjs',
    ],
  },
  ...ionic,
];
