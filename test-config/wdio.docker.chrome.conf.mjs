import common from './wdio.common.conf.mjs'

export const config = {
  ...common('docker'),

  hostname: 'localhost',
  port: 4444,
  path: '/wd/hub',
  //
  // If you have trouble getting all important capabilities together, check out the
  // Sauce Labs platform configurator - a great tool to configure your capabilities:
  // https://docs.saucelabs.com/reference/platforms-configurator
  //
  capabilities: [{
    browserName: 'chrome',
    'goog:chromeOptions': {
      args: ['--disable-gpu']
    }
  }],

  //
  // Set a base URL in order to shorten url command calls. If your `url` parameter starts
  // with `/`, the base url gets prepended, not including the path portion of your baseUrl.
  // If your `url` parameter starts without a scheme or `/` (like `some/path`), the base url
  // gets prepended directly.
  baseUrl: 'http://bln.test.liveintent.com',
  //
  // Default timeout for all waitFor* commands.
  waitforTimeout: 10000,
  //
  // Default timeout in milliseconds for request
  // if Selenium Grid doesn't send response
  connectionRetryTimeout: 10000,
  services: ['docker'],
  dockerOptions: {
    image: 'selenium/standalone-chrome:4.9.1-20230508',
    healthCheck: 'http://bln.test.liveintent.com:9091',
    options: {
      p: ['9091:4444'],
      shmSize: '1g',
      network: 'host'
    }
  }
}
