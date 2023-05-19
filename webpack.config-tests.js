// eslint-disable-next-line @typescript-eslint/no-var-requires
const commonConfig = require('live-connect-common/webpack.config.common')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require('webpack')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('./package.json')

const config = commonConfig('lcHandlers')

module.exports = {
  ...config,
  module: {
    rules: [{
      test: /\.ts$/,
      use: [{
        loader: 'babel-loader',
        options: {
          presets: [
            ['@babel/preset-env', { targets: '> 0.25%, not dead' }]
          ],
          plugins: [
            '@babel/plugin-proposal-class-properties',
            ['@babel/plugin-proposal-object-rest-spread', { useBuiltIns: true }],
            ['@babel/plugin-transform-destructuring', { useBuiltIns: true }],
            '@babel/plugin-transform-shorthand-properties',
            '@babel/plugin-transform-arrow-functions'
          ]
        }
      },
      ...config.module.rules[0].use
      ]
    }]
  },
  entry: './test/it/helpers/preambled.ts',
  output: {
    path: path.resolve('./', 'test-resources'),
    filename: 'bundle.iife.js',
    environment: {
      arrowFunction: false,
      destructuring: false,
      forOf: false,
      optionalChaining: false
    }
  },
  optimization: {
    minimize: false
  },
  plugins: [
    ...config.plugins,
    new webpack.DefinePlugin({
      LC_VERSION: JSON.stringify(`${pkg.versionPrefix}${pkg.version}`)
    })
  ]
}
