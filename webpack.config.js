// eslint-disable-next-line @typescript-eslint/no-var-requires
const commonConfig = require('live-connect-common/webpack.config.common')

const config = commonConfig('lcHandlers', { passes: 2 })
module.exports = {
  ...config,
  externals: [
    /live-connect-common/,
    /live-connect-handlers/,
    'js-cookie'
  ]
}
