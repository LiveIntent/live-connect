import commonConfig from './wdio.common.conf.mjs'
import http from 'http';
import https from 'https';
const currentTime = Date.now()
const commonBStackCapabilities = {
  projectName: 'LiveConnect',
  buildName: `${process.env.CIRCLE_BRANCH || process.env.DEV_BRANCH || 'X'}-${process.env.CIRCLE_BUILD_NUM || currentTime}`,
  video: true,
  debug: true,
  networkLogs: true
}

// https://www.browserstack.com/automate/capabilities
const allCapabilities = [
  { browserName: 'Chrome', browserVersion: 'latest', 'bstack:options': { ...commonBStackCapabilities, os: 'Windows', osVersion: '10' } },
  { browserName: 'Chrome', browserVersion: '45.0', 'bstack:options': { ...commonBStackCapabilities, os: 'Windows', osVersion: '7' } },
  { browserName: 'firefox', browserVersion: 'latest', 'bstack:options': { ...commonBStackCapabilities, os: 'Windows', osVersion: '10' } },
  { browserName: 'firefox', browserVersion: '52.0', 'bstack:options': { ...commonBStackCapabilities, os: 'Windows', osVersion: '7' } },
  { browserName: 'IE', browserVersion: '11.0', 'bstack:options': { ...commonBStackCapabilities, os: 'Windows', osVersion: '10', seleniumVersion: '3.5.2' } },
  { browserName: 'Edge', browserVersion: 'latest', 'bstack:options': { ...commonBStackCapabilities, os: 'Windows', osVersion: '10' } },

  { browserName: 'Safari', browserVersion: '14.1', 'bstack:options': { ...commonBStackCapabilities, os: 'OS X', osVersion: 'Big Sur' } },
  { browserName: 'Safari', browserVersion: '13.1', 'bstack:options': { ...commonBStackCapabilities, os: 'OS X', osVersion: 'Catalina' } },
  { browserName: 'Safari', browserVersion: '12.1', 'bstack:options': { ...commonBStackCapabilities, os: 'OS X', osVersion: 'Mojave' } },
  { browserName: 'Safari', browserVersion: '11.1', 'bstack:options': { ...commonBStackCapabilities, os: 'OS X', osVersion: 'High Sierra' } },
  { browserName: 'Safari', browserVersion: '10.1', 'bstack:options': { ...commonBStackCapabilities, os: 'OS X', osVersion: 'Sierra' } },

  { browserName: 'Safari', browserVersion: '15.0', 'bstack:options': { ...commonBStackCapabilities, deviceName: 'iPhone 11 Pro', osVersion: '15', realMobile: true } },
  { browserName: 'Safari', browserVersion: '14.0', 'bstack:options': { ...commonBStackCapabilities, deviceName: 'iPhone 12', osVersion: '14', realMobile: true } },
  { browserName: 'Safari', browserVersion: '13.0', 'bstack:options': { ...commonBStackCapabilities, deviceName: 'iPhone 11', osVersion: '13', realMobile: true } },
  { browserName: 'Safari', browserVersion: '12.0', 'bstack:options': { ...commonBStackCapabilities, deviceName: 'iPhone 8', osVersion: '12', realMobile: true } },
  { browserName: 'Safari', browserVersion: '11.0', 'bstack:options': { ...commonBStackCapabilities, deviceName: 'iPad Pro 9.7 2016', osVersion: '11', realMobile: true } },

  { browserName: 'Chrome', browserVersion: 'latest', 'bstack:options': { ...commonBStackCapabilities, deviceName: 'Samsung Galaxy S21', osVersion: '11.0', realMobile: true } },
  { browserName: 'Chrome', browserVersion: '67', 'bstack:options': { ...commonBStackCapabilities, deviceName: 'Samsung Galaxy S8', osVersion: '7.0', realMobile: true } }
]

export const config = {
  ...commonConfig('browserstack'),
  //
  // If you have trouble getting all important capabilities together, check out the
  // Sauce Labs platform configurator - a great tool to configure your capabilities:
  // https://docs.saucelabs.com/reference/platforms-configurator
  //
  capabilities: allCapabilities,

  //
  // ===================
  // Test Configurations
  // ===================
  // Define all options that are relevant for the WebdriverIO instance here
  //
  // Level of logging verbosity: trace | debug | info | warn | error | silent
  logLevel: 'warn',

  //
  // Set specific log levels per logger
  // loggers:
  // - webdriver, webdriverio
  // - @wdio/applitools-service, @wdio/browserstack-service, @wdio/devtools-service, @wdio/sauce-service
  // - @wdio/mocha-framework, @wdio/jasmine-framework
  // - @wdio/local-runner, @wdio/lambda-runner
  // - @wdio/sumologic-reporter
  // - @wdio/cli, @wdio/config, @wdio/sync, @wdio/utils
  // Level of logging verbosity: trace | debug | info | warn | error | silent
  logLevels: {
    webdriver: 'warn',
    '@wdio/browserstack-service': 'info'
  },

  //
  // Set a base URL in order to shorten url command calls. If your `url` parameter starts
  // with `/`, the base url gets prepended, not including the path portion of your baseUrl.
  // If your `url` parameter starts without a scheme or `/` (like `some/path`), the base url
  // gets prepended directly.
  baseUrl: 'http://localhost',

  //
  // Default timeout for all waitFor* commands.
  waitforTimeout: 30000,

  //
  // Default timeout in milliseconds for request
  // if Selenium Grid doesn't send response
  connectionRetryTimeout: 300000,

  services: [['browserstack', {
    browserstackLocal: true,

    opts: {
      verbose: true
    }
  }]],

  user: process.env.BS_USER,
  key: process.env.BS_KEY,
  hostname: 'hub.browserstack.com',

  agent: {
    http: new http.Agent({ keepAlive: true }),
    https: new https.Agent({ keepAlive: true })
  },
  //
  // The number of times to retry the entire specfile when it fails as a whole
  specFileRetries: 2
}
