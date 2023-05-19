// eslint-disable-next-line @typescript-eslint/no-var-requires
const commonConfig = require('live-connect-common/webpack.config.common')
const config = commonConfig('lcHandlers', { passes: 2 })
module.exports = {
  ...config,
  module: {
    rules: [{
      test: /\.ts$/,
      use: [{
        loader: 'babel-loader',
        options: {
          presets: [
            ['@babel/preset-env', { forceAllTransforms: true }],
            '@babel/preset-typescript'
          ],
          plugins: [
            '@babel/plugin-proposal-class-properties',
            ['@babel/plugin-proposal-object-rest-spread', { useBuiltIns: true }],
            ['@babel/plugin-transform-destructuring', { useBuiltIns: true }],
            '@babel/plugin-transform-shorthand-properties',
            '@babel/plugin-transform-arrow-functions'
          ]
        }
      }
      ]
    }]
  },
  output: {
    ...config.output,
    libraryTarget: 'umd'
  },
  optimization: {
    ...config.optimization,
    minimize: true
  }
}
