# LiveConnect

[![BrowserStack Status](https://automate.browserstack.com/badge.svg?badge_key=a1dpTXF4aXcwcERUbjNTMlB3L2xxRmlFbk1PaUVTMUx1OFU0UkJRUlpXaz0tLVB5V0dkNXpmZzF5ZDNaZ2ZsQnNzR3c9PQ==--19c73b84bcddaa14fb090cf5743e41b451d2c646)](https://automate.browserstack.com/public-build/a1dpTXF4aXcwcERUbjNTMlB3L2xxRmlFbk1PaUVTMUx1OFU0UkJRUlpXaz0tLVB5V0dkNXpmZzF5ZDNaZ2ZsQnNzR3c9PQ==--19c73b84bcddaa14fb090cf5743e41b451d2c646) [![CircleCI](https://circleci.com/gh/liveintent-berlin/live-connect/tree/master.svg?style=svg)](https://circleci.com/gh/liveintent-berlin/live-connect/tree/master)[![codecov](https://codecov.io/gh/liveintent-berlin/live-connect/branch/master/graph/badge.svg?token=P5sRpM4U6k)](https://codecov.io/gh/liveintent-berlin/live-connect)

# Main concepts
LiveConnect module is used to create, and or gather first party identifiers of your choosing, and sendind that information to a defined endpoint which is responsible for gathering and processing that data. 
What LiveConnect provides is a simple interface to collect the identifiers from a page, and collect user interactions along with those identifiers. 
To see what kind of data is being sent, check [what is being sent](#what-is-being-sent).

## Quick start
- With [npm](https://www.npmjs.com/): `npm install`
- Format the code according to the eslint file: `npm run fix-js`
- Run unit tests: `npm run test:unit`
- Run integration tests against a dockerized chrome: `npm run test:it:docker:chrome`
- Run full integration tests on multiple browsers (requires properly set Browserstack credentials) : `npm run test:it:browserstack`

## Contribute
We're open to ideas, fixes and improvements. Find out how to contribute [here](./CONTRIBUTING.md).

## Testing
### Running Unit tests
Unit tests are written using [Mocha](http://mochajs.org/) and [Chai](http://chaijs.com/).
Check [Quick start](#quick-start) how to run them.

### Running Browserstack tests
Tests are setting the cookies on eTLD+1 domain. For that, execute this command once:
```echo "127.0.0.1 bln.test.liveintent.com" | sudo tee -a /etc/hosts && echo "127.0.0.1 test.liveintent.com" | sudo tee -a /etc/hosts && echo "127.0.0.1 me.idex.com"  | sudo tee -a /etc/hosts```

Add Browserstack keys to your env, where the setup would be as follows:
```
user: process.env.BS_USER,
key: process.env.BS_KEY,
```
or, to run Browserstack tests locally, run:
```BS_USER=${User} BS_KEY=${Key} npm run test:it:browserstack```

The browsers used in these tests are defined in `test-config/wdio.browserstack.conf.js` and should correlate to the transpiled code for supported browsers, listed in `.browserslistrc`.
___

## Main concepts
### Initialization
The initialisation part should be straight forward, considering the snippet:
```javascript
import { LiveConnect } from 'live-connect-js/src/live-connect'
const lc = LiveConnect(configOptions)
```

The object returned after initialisation (`lc` in the snippet above) is exposing the following functions:
- `push` accepts a custom event one would like to keep track of.
- `fire` just fires a pixel, and can be considered as a simple page view.
- `peopleVerifiedId` returns the most likely first party cookie that can be used for identity resolution.
- `ready` flag, saying that the LC was loaded and ready, can be used when including LiveConnect as a global var on the window object.
- `resolve` function accepts a callback and an additional object with key value pairs. Of course, errors during resolution will be emitted on the EventBus and sent to the collector. The second parameter is `additionalParameters` which is an object, and will be attached to the IdentityResolution request, split into key-value pairs. The purpose of this object is to include key-value pairs in the request, e.g. for identifiers that cannot be found in the cookie jar, or in LocalStorage, or simply there's a requirement for a certain identifier to be represented under a specific key which doesn't match it's name in the cookie jar, or LocalStorage key.
- `resolutionCallUrl` function receives the URL to be called in order to receive the resolution to a stable identifier.

### Overriding the StorageHandler.
LiveConnect can be initialized in a way so that it does not manipulate storage on the device on it's own. For example, if one wants to use it's own handler for storage, it is enough to send the storage handler in the constructor.
The only thing one needs to adhere to is the signature of each function that's needed on the StorageHandler:
- `function hasLocalStorage ()`
- `function getCookie (key)`
- `function getDataFromLocalStorage (key)`
- `function findSimilarCookies (keyLike)`
- `function setCookie (key, value, expires, sameSite, domain)`
- `function removeDataFromLocalStorage (key)`
- `function setDataInLocalStorage (key, value)`

If one of the functions is not available in the external handler, LiveConnect will fallback to it's own implementation to ensure that the functionality isn't being affected.

One way to acheive that is, for example, to initialize LC like this:
```javascript
import { LiveConnect } from 'live-connect-js/src/live-connect'
const storageHandler = {
  getCookie: (key) => {
    let m = window.document.cookie.match('(^|;)\\s*' + key + '\\s*=\\s*([^;]*)\\s*(;|$)')
    return m ? decodeURIComponent(m[2]) : null;
  },
  setCookie: (key, value, expires, sameSite, domain) => {
    //
  }
}
const lc = LiveConnect(configOptions, storageHandler)
``` 

### Configuration options
Considering the snippet above, LiveConnect accepts a JSON with the config which determines its behaviour.
You can learn more about available options [here](./CONFIGURATION_OPTIONS.md).

## Managers
The code in the `manager` folder is responsible for browser state interaction and management, e.g. storage manipulation.
It's sometimes important in which order the managers are invoked, as one might depend on the result of another.

### Decisions manager
`managers/decision.js` is responsible for keeping state in the browser with all the recent `li_did` parameters picked up from urls where LiveConnect was loaded.

### Identifiers manager
`managers/identifiers.js` takes care of LiveConnect first party identifiers being created (if not present) and picked up so that they can be sent as signal pixels, or if the customers set the `providedIdentifierName`, that this information is also relayed to the pipeline.
Where the LiveConnect identifiers are stored (Cookie vs LocalStorage) depends on the `config.storageStrategy` option.
How long those identifiers will live is configured in the `config.expirationDays` parameter. In case the `storageStrategy` is set to Cookie, the browser will ensure that the cookie expires.
In case of localStorage, Identifiers Manager and it's underlying `utils/storage.js` helper will ensure that on the next load, the entry is removed from localstorage in case it's obsolete.

### Legacy duid manager
`managers/legacy-diud.js` or, legacy domainUserId manager, is responsible for maintaining the legacy LiveConnect cookies, which were created and maintained by previous versions of LiveConnect 

### People Verified manager
`managers/people-verified.js` makes sure that either of the selected identifiers is stored as the `_li_duid` key in local storage, as some integrations are using the information stored there. 

## Enrichments
The `enrichers` folder contains code responsible for extracting specific information about the page visit when the module is loaded. It makes sure that the extracted data is stored in the state which contains data which is sent as a single pixel.

### Page enrichment
`enrichers/page.js` holds the logic which determines the real page url on which we're trying to capture user interactions.

### Identifiers enrichment
`enrichers/identifiers.js` is responsible for reading the `identifiersToResolve` configuration parameter to read any additional identifiers that customers want to share with us.

## Messaging between components via EventBus (`__li__evt_bus`) 
LiveConnect exposes an object on the window level (`window.__li_evt_bus`) which is responsible for communicating various information based on different fields of interests.
For example, there are three topics which anyone can hook to, and receive information about:
- errors, on the `li_errors` topic
- whenever the pixel is sent successfully, the `lips` topic will emit that information
- just before the pixel is sent, `pre_lips` topic will contain the information about it.

The following snippets can be used to hook up to one of the topics and receive events as they happen.
```javascript
const lipsLogger = (message) => { console.info('Received a lips message, will continue receiving them', message) }
window.__li_evt_bus.on('lips', logger)
```
or
```javascript
const lipsLogger = (message) => { console.info('Received a lips message once, i will self destruct now.', message) }
window.__li_evt_bus.once('lips', logger)
```

There are a two ways this can be achieved:
- `once` - will be triggered only once, and the handler which is subscribing to that topic will be automatically removed once the event is received and sent.
- `on` - will be triggered every time the topic receives a message.

The bus isn't a pure event listener, as we also want to cover the case where handlers can be attached even after messages have been emitted.
An example how to hook to the topic will be explained in the next section.

## Error handling
Vital logic is wrapped in try catch blocks, and where it makes sense, the error message is emitted on the `li_errors` topic in the `window.__li_evt_bus`.
To start listening to the topic, one can simply implement their own logic. For example, if logging the messages is of interest, the following snippet can be used:
```javascript
const logger = (message) => {console.error('Error message received on the __li_evt_bus', message)}
window.__li_evt_bus.on('li_errors', logger)
```
## Receiving errors on the collector
LiveConnect has a handler called `handlers/error-pixel.js` which is subscribed on the `li_errors` topic, and wraps the exceptions into the following format:
```javascript
{
    message: e.message,
    name: e.name,
    stackTrace: e.stack,
    lineNumber: e.lineNumber,
    lineColumn: e.lineColumn,
    fileName: e.fileName
}
```
Every time there's an exception in LiveConnect, this handler will create such a message, and LiveConnect will send the base64 url encoded message to the collector containing the details above.

___

# What is being sent?
The user interaction is sent to a url specified in the inbound config, as `collectorUrl`, only if the information is present.
For example, one of the parameters is `aid` which should send the value of the `appId` from the config, however, if it is not set, it will not be sent.
For more details on requests being sent take a look at [collector parameters](./COLLECTOR_PARAMS.md).
