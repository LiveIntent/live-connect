import commonConfig from './wdio.common.conf.js'

export const config = {
  ...commonConfig('local'),

  capabilities: [{
    browserName: 'chrome',
    browserVersion: 'stable',
    'goog:chromeOptions': {
      args: [
        '--disable-gpu',
        '--disable-features=ProcessPerSiteUpToMainFrameThreshold' // messes with debugger
      ]
    }
  }],

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
  connectionRetryTimeout: 30000
}
