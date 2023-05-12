// eslint-disable-next-line @typescript-eslint/no-var-requires
const commonConfig = require('live-connect-common/webpack.config.common')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require('webpack')

const config = commonConfig('lcHandlers')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('./package.json')

module.exports = {
  ...config,
  entry: './test/it/helpers/preambled.ts',
  output: {
    path: path.resolve('./', 'test-resources'),
    filename: 'bundle.iife.js'
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
