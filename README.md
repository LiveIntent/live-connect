# LiveConnect

[![BrowserStack Status](https://automate.browserstack.com/badge.svg?badge_key=YzloV1dIQUNFOHFkOXlJRUxLNXZxSEFvTVVOSHVIVGFHS05tdnNicTRpTT0tLVVVOUpGWUE2SEJNTlZpT2xnSVBjYmc9PQ==--cfc32e5172c470536344a9c6b751a20019aab049)](https://automate.browserstack.com/public-build/YzloV1dIQUNFOHFkOXlJRUxLNXZxSEFvTVVOSHVIVGFHS05tdnNicTRpTT0tLVVVOUpGWUE2SEJNTlZpT2xnSVBjYmc9PQ==--cfc32e5172c470536344a9c6b751a20019aab049)
[![CircleCI](https://circleci.com/gh/LiveIntent/live-connect/tree/master.svg?style=svg)](https://circleci.com/gh/LiveIntent/live-connect/tree/master)
[![codecov](https://codecov.io/gh/LiveIntent/live-connect/branch/master/graph/badge.svg?token=P5sRpM4U6k)](https://codecov.io/gh/LiveIntent/live-connect)
[![CodeQL](https://github.com/LiveIntent/live-connect/actions/workflows/codeql.yml/badge.svg?branch=master&event=push)](https://github.com/LiveIntent/live-connect/actions/workflows/github-code-scanning/codeql)
[![dependencies Status](https://img.shields.io/librariesio/release/npm/live-connect)](https://github.com/LiveIntent/live-connect/tree/master)

## Main concepts
The LiveConnect module offers a convenient solution for generating and collecting first-party identifiers based on your preferences and sending this information to a designated endpoint. With LiveConnect, you gain a straightforward interface that facilitates the collection of identifiers from web pages, as well as capturing user interactions alongside these identifiers.
If you're interested in reviewing the type of data being sent, please check [what is being sent](#what-is-being-sent) section of this documentation.

## Quick start
To quickly get started with the LiveConnect module, perform the following steps via the command line interface.

- Dependency installation: Begin by installing the dependencies using npm. Run the following command: `npm install`.
- Code formatting: Ensure your code adheres to the provided ESLint file for consistent formatting. Use the command `npm run fix-js` to automatically format your code.
- Unit testing: Validate the functionality of your code by running the unit tests. Execute the command `npm run test:unit` to initiate the tests.
- Integration testing: Verify the integration of LiveConnect by running the integration tests against a dockerized Chrome browser. Use the command `npm run test:it:docker:chrome` to perform these tests.
- Cross-browser testing: For a comprehensive evaluation, conduct full integration tests on multiple browsers. Please ensure you have valid Browserstack credentials configured. Run the command `npm run test:it:browserstack` to execute the tests across various browsers.

## Contribute
We welcome ideas, fixes, and improvements from the community. Discover how you can contribute by visiting our [contribution guidelines](./CONTRIBUTING.md).

## Testing
### Running Unit tests
Unit tests are written using [Mocha](http://mochajs.org/) and [Chai](http://chaijs.com/).
Check [Quick Start](#quick-start) how to run them.

### Running Browserstack tests
Tests set the cookies on eTLD+1 domain. For that, execute the following command:
```echo "127.0.0.1 bln.test.liveintent.com" | sudo tee -a /etc/hosts && echo "127.0.0.1 test.liveintent.com" | sudo tee -a /etc/hosts && echo "127.0.0.1 me.idex.com" | sudo tee -a /etc/hosts && echo "127.0.0.1 schmoogle.com" | sudo tee -a /etc/hosts && echo "127.0.0.1 framed.test.liveintent.com" | sudo tee -a /etc/hosts && echo "127.0.0.1 double-framed.test.liveintent.com" | sudo tee -a /etc/hosts && echo "127.0.0.1 baked.liveintent.com" | sudo tee -a /etc/hosts```

Add Browserstack keys to your env, where the setup would be as follows:
```
user: process.env.BS_USER,
key: process.env.BS_KEY,
```
or, to run Browserstack tests locally, run:
```BS_USER=${User} BS_KEY=${Key} npm run test:it:browserstack```

The browsers used in these tests are defined in `test-config/wdio.browserstack.conf.js` and should correlate to the transpiled code for supported browsers, listed in `.browserslistrc`.
___

## Initialization
The initialization part should be straightforward, considering the snippet:
```javascript
import { LiveConnect } from 'live-connect-js'
const lc = LiveConnect(configOptions)
```

The object returned after initialization (`lc` in the snippet above) is exposing the following functions:
- `push` accepts a custom event one would like to keep track of.
- `fire` just fires a pixel, and can be considered as a simple page view.
- `peopleVerifiedId` returns the most likely first party cookie that can be used for identity resolution.
- `ready` flag, saying that the LC was loaded and ready, can be used when including LiveConnect as a global var on the window object.
- `resolve` function accepts a success callback, an error callback and an additional object with key value pairs. Of course, errors during resolution will be emitted on the EventBus and sent to the collector. The third parameter is `additionalParameters` which is an object and will be attached to the IdentityResolution request, split into key-value pairs. The purpose of this object is to include key-value pairs in the request, e.g. for identifiers that cannot be found in the cookie jar, or in LocalStorage, or simply there's a requirement for a certain identifier to be represented under a specific key which doesn't match its name in the cookie jar, or LocalStorage key.
- `resolutionCallUrl` function returns the URL to be called in order to receive the resolution to a stable identifier.

### Overriding the StorageHandler and CallHandler
LiveConnect is initialized in a way so that it does not manipulate storage and call on the device on its own.

The StorageHandler is an object with functions that adhere to the signature:
- `function localStorageIsEnabled ()`
- `function getCookie (key)`
- `function getDataFromLocalStorage (key)`
- `function findSimilarCookies (keyLike)`
- `function setCookie (key, value, expires, sameSite, domain)`
- `function removeDataFromLocalStorage (key)`
- `function setDataInLocalStorage (key, value)`

The CallHandler is another object with functions:
- `function ajaxGet (uri, responseHandler, fallback, timeout)`
where the `responseHandler` is a `function(body, response)`,
and the `fallback` is a `function()`
- `function pixelGet (uri, onload)`
where the `onload` is a `function()`

If one of the functions is not available in the external handler, LiveConnect will fall back to stubs to ensure that the overall functionality isn't being affected. It is recommended to provide full implementations of the interfaces. Default
implementations of the handlers can be found in the `live-connect-handlers` project.

With custom implementations, the initialization can look like this:
```javascript
import { LiveConnect } from 'live-connect-js'

const storageHandler = {
  getCookie: (key) => {
    let m = window.document.cookie.match('(^|;)\\s*' + key + '\\s*=\\s*([^;]*)\\s*(;|$)')
    return m ? decodeURIComponent(m[2]) : null;
  },
  setCookie: (key, value, expires, sameSite, domain) => {
    //
  },
  ...
}
const callHandler = {
  ajaxGet: (url, responseHandler, fallback, timeout) => {
   //
  },
  pixelGet: (url, onload) => {
   //
  }
}
const lc = LiveConnect(configOptions, storageHandler, callHandler)
```

### Configuration options
Considering the snippet above, LiveConnect accepts a JSON with the config which determines its behaviour.
You can learn more about available options [here](./CONFIGURATION_OPTIONS.md).

## Managers
The code in the `manager` folder is responsible for browser state interaction and management, e.g. storage manipulation.
It's sometimes important in which order the managers are invoked, as one might depend on the result of another.

### Decisions manager
`managers/decision.js` is responsible for keeping the state in the browser with all the recent `li_did` parameters picked up from urls where LiveConnect was loaded.

### Identifiers manager
`managers/identifiers.js` takes care of LiveConnect first party identifiers being created (if not present) and picked up so that they can be sent as signal pixels containing that information.
Where the LiveConnect identifiers are stored (Cookie vs LocalStorage) depends on the `config.storageStrategy` option.
How long those identifiers will live is configured in the `config.expirationDays` parameter. In case the `storageStrategy` is set to Cookie, the browser will ensure that the cookie expires.
In case of localStorage, Identifiers Manager and its underlying `utils/storage.js` helper will ensure that on the next load, the entry is removed from localStorage in case it's obsolete.

### People-verified manager
`managers/people-verified.js` makes sure that either of the selected identifiers is stored as the `_li_duid` key in local storage, as some integrations are using the information stored there.

## Enrichments
The `enrichers` folder contains code responsible for extracting specific information about the page visit when the module is loaded. It makes sure that the extracted data is stored in the state which contains data that is sent as a single pixel.

### Page enrichment
`enrichers/page.js` holds the logic which determines the real page url on which we're trying to capture user interactions.

### Identifiers enrichment
`enrichers/identifiers.js` is responsible for reading the `identifiersToResolve` configuration parameter to read any additional identifiers that customers want to share with us.

## Messaging between components via EventBus
LiveConnect exposes an object via the field `eventBus` on the LiveConnect instance which is responsible for communicating various information based on different fields of interest.
For example, there are three topics that anyone can hook to, and receive information about:
- errors, on the `li_errors` topic
- whenever the pixel is sent successfully, the `lips` topic will emit that information
- just before the pixel is sent, `pre_lips` topic will contain the information about it.

The following snippets can be used to hook up to one of the topics and receive events as they happen. Here, `lc` is a reference to a LiveConnect instance.
```javascript
const lipsLogger = (message) => { console.info('Received a lips message, will continue receiving them', message) }
lc.eventBus.on('lips', lipsLogger)
```
or
```javascript
const lipsLogger = (message) => { console.info('Received a lips message once, it will self destruct now.', message) }
lc.eventBus.once('lips', lipsLogger)
```

There are two ways this can be achieved:
- `on` - will be triggered every time the topic receives a message.
- `once` - will be triggered only once, and the handler that is subscribing to that topic will be automatically removed once the event is received and sent.

The bus isn't a pure event listener, as we also want to cover the case where handlers can be attached even after messages have been emitted.
An example of how to hook to the topic will be explained in the next section.

## Error handling
Vital logic is wrapped in try catch blocks, and where it makes sense, the error message is emitted on the `li_errors` topic in the eventBus.
To start listening to the topic, one can simply implement their own logic. For example, if logging the messages is of interest, the following snippet can be used:
```javascript
const logger = (message) => {console.error('Error message received on the event bus', message)}
lc.eventBus.on('li_errors', logger)
```

## Receiving errors on the collector
LiveConnect has a handler called `events/error-pixel.js` which is subscribed on the `li_errors` topic, and wraps the exceptions into the following format:
```javascript
{
    message: e.message,
    name: e.name,
    stackTrace: e.stack,
    lineNumber: e.lineNumber,
    columnNumber: e.columnNumber,
    fileName: e.fileName
}
```
Every time there's an exception in LiveConnect, this handler will create such a message, and LiveConnect will send the base64 url encoded message to the collector containing the details above.

___

# What is being sent?
The user interaction is sent to a url specified in the inbound config, as `collectorUrl`, only if the information is present.
For example, one of the parameters is `aid` which should send the value of the `appId` from the config, however, if it is not set, it will not be sent.
For more details on requests being sent take a look at [collector parameters](./COLLECTOR_PARAMS.md).
