module.exports = {
  root: true,
  env: {
    'browser': true,
    'commonjs': true,
    'es6': true,
    'node': true,
    'mocha': true
  },
  parser: '@typescript-eslint/parser',
  plugins: [
    'wdio',
    "@typescript-eslint"
  ],
  extends: [
    'standard',
    'plugin:wdio/recommended',
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  globals: {},
  rules: {}
}
