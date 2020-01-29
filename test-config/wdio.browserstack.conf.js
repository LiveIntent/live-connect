const currentTime = Date.now()
const commonCapabilities = {
  project: 'LiveConnect',
  build: `${process.env.CIRCLE_BRANCH || process.env.DEV_BRANCH || 'X'}-${process.env.CIRCLE_BUILD_NUM || currentTime}`,
  'browserstack.video': true,
  'browserstack.console': 'verbose',
  'browserstack.debug': true,
  'browserstack.networkLogs': true,
  'browserstack.appium_version': '1.14.0'
}

const allCapabilities = [
  { ...commonCapabilities, browserName: 'Chrome', browser_version: '74.0', os: 'Windows', os_version: '10' },
  { ...commonCapabilities, browserName: 'Chrome', browser_version: '40.0', os: 'Windows', os_version: '7' },
  { ...commonCapabilities, browserName: 'firefox', browser_version: '67.0', os: 'Windows', os_version: '10' },
  { ...commonCapabilities, browserName: 'firefox', browser_version: '52.0', os: 'Windows', os_version: '7' },
  { ...commonCapabilities, browserName: 'Safari', browser_version: '12.0', os: 'OS X', os_version: 'Mojave' },
  { ...commonCapabilities, browserName: 'Safari', browser_version: '11.1', os: 'OS X', os_version: 'High Sierra' },
  { ...commonCapabilities, browserName: 'Safari', browser_version: '10.1', os: 'OS X', os_version: 'Sierra' },
  { ...commonCapabilities, browserName: 'Safari', browser_version: '7.1', os: 'OS X', os_version: 'Mavericks' },
  { ...commonCapabilities, browserName: 'IE', browser_version: '11.0', os: 'Windows', os_version: '7' },
  { ...commonCapabilities, browserName: 'IE', browser_version: '10.0', os: 'Windows', os_version: '7' },
  { ...commonCapabilities, browserName: 'IE', browser_version: '9.0', os: 'Windows', os_version: '7' },
  { ...commonCapabilities, browserName: 'Edge', browser_version: '18.0', os: 'Windows', os_version: '10' },
  { ...commonCapabilities, browserName: 'Edge', browser_version: '15.0', os: 'Windows', os_version: '10', 'browserstack.selenium_version': '3.141.59' },
  { ...commonCapabilities, browserName: 'Safari', browser_version: '12.0', os_version: '12', device: 'iPhone 8', real_mobile: true },
  { ...commonCapabilities, browserName: 'Safari', browser_version: '11.0', os_version: '11', device: 'iPad Pro 9.7 2016', real_mobile: true },
  { ...commonCapabilities, browserName: 'Chrome', browser_version: '73.0', os_version: '7.0', device: 'Samsung Galaxy S8', real_mobile: true },
  { ...commonCapabilities, browserName: 'Chrome', browser_version: '67', os_version: '6.0', device: 'Google Nexus 6', real_mobile: true }
]

exports.config = {
  //
  // ====================
  // Runner Configuration
  // ====================
  //
  // WebdriverIO allows it to run your tests in arbitrary locations (e.g. locally or
  // on a remote machine).
  runner: 'local',
  //
  // Override default path ('/wd/hub') for chromedriver service.
  // path: '/',
  //
  // ==================
  // Specify Test Files
  // ==================
  // Define which test specs should run. The pattern is relative to the directory
  // from which `wdio` was called. Notice that, if you are calling `wdio` from an
  // NPM script (see https://docs.npmjs.com/cli/run-script) then the current working
  // directory is where your package.json resides, so `wdio` will be called from there.
  //
  specs: [
    './test/it/**/*.spec.js'
  ],
  // Patterns to exclude.
  exclude: [
    // 'path/to/excluded/files'
  ],
  //
  // ============
  // Capabilities
  // ============
  // Define your capabilities here. WebdriverIO can run multiple capabilities at the same
  // time. Depending on the number of capabilities, WebdriverIO launches several test
  // sessions. Within your capabilities you can overwrite the spec and exclude options in
  // order to group specific specs to a specific capability.
  //
  // First, you can define how many instances should be started at the same time. Let's
  // say you have 3 different capabilities (Chrome, Firefox, and Safari) and you have
  // set maxInstances to 1; wdio will spawn 3 processes. Therefore, if you have 10 spec
  // files and you set maxInstances to 10, all spec files will get tested at the same time
  // and 30 processes will get spawned. The property handles how many capabilities
  // from the same test should run tests.
  //
  maxInstances: 1,
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
  // If you only want to run your tests until a specific amount of tests have failed use
  // bail (default is 0 - don't bail, run all tests).
  bail: 0,
  //
  // Set a base URL in order to shorten url command calls. If your `url` parameter starts
  // with `/`, the base url gets prepended, not including the path portion of your baseUrl.
  // If your `url` parameter starts without a scheme or `/` (like `some/path`), the base url
  // gets prepended directly.
  baseUrl: 'http://localhost',
  //
  // Default timeout for all waitFor* commands.
  waitforTimeout: 60000,
  //
  // Default timeout in milliseconds for request
  // if Selenium Grid doesn't send response
  connectionRetryTimeout: 30000,
  //
  // Default request retries count
  connectionRetryCount: 3,
  //
  // Test runner services
  // Services take over a specific job you don't want to take care of. They enhance
  // your test setup with almost no effort. Unlike plugins, they don't add new
  // commands. Instead, they hook themselves up into the test process.
  services: ['browserstack'],
  user: process.env.BS_USER,
  key: process.env.BS_KEY,
  browserstackLocal: true,
  browserstackOpts: {
    verbose: true
  },
  // Framework you want to run your specs with.
  // The following are supported: Mocha, Jasmine, and Cucumber
  // see also: https://webdriver.io/docs/frameworks.html
  //
  // Make sure you have the wdio adapter package for the specific framework installed
  // before running any tests.
  framework: 'mocha',
  //
  // The number of times to retry the entire specfile when it fails as a whole
  // specFileRetries: 1,
  //
  // Test reporter for stdout.
  // The only one supported by default is 'dot'
  // see also: https://webdriver.io/docs/dot-reporter.html
  reporters: [
    'spec',
    ['junit', {
      outputDir: './test-results/browserstack',
      outputFileFormat: function (options) {
        return `${options.capabilities.browserName}_${options.capabilities.version}_${options.capabilities.platform}_${options.cid}.xml`
      }
    }]
  ],

  //
  // Options to be passed to Mocha.
  // See the full list at http://mochajs.org/
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
    require: ['@babel/register']
  }

}
