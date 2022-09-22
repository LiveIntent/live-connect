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
    'wdio'
  ],
  extends: [
    'standard',
    'plugin:wdio/recommended'
  ],
  globals: {},
  rules: {}
}
