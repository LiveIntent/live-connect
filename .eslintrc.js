module.exports = {
  root: true,
  env: {
    'browser': true,
    'commonjs': true,
    'es6': true,
    'node': true,
    'mocha': true
  },
  plugins: [
    'wdio',
    '@typescript-eslint'
  ],
  extends: [
    'standard',
    'plugin:wdio/recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  globals: {},
  rules: {}
}
