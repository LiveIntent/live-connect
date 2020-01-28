## LiveConnect

[![BrowserStack Status](https://automate.browserstack.com/badge.svg?badge_key=a1dpTXF4aXcwcERUbjNTMlB3L2xxRmlFbk1PaUVTMUx1OFU0UkJRUlpXaz0tLVB5V0dkNXpmZzF5ZDNaZ2ZsQnNzR3c9PQ==--19c73b84bcddaa14fb090cf5743e41b451d2c646)](https://automate.browserstack.com/public-build/a1dpTXF4aXcwcERUbjNTMlB3L2xxRmlFbk1PaUVTMUx1OFU0UkJRUlpXaz0tLVB5V0dkNXpmZzF5ZDNaZ2ZsQnNzR3c9PQ==--19c73b84bcddaa14fb090cf5743e41b451d2c646) [![CircleCI](https://circleci.com/gh/liveintent-berlin/live-connect/tree/master.svg?style=svg)](https://circleci.com/gh/liveintent-berlin/live-connect/tree/master)[![codecov](https://codecov.io/gh/liveintent-berlin/live-connect/branch/master/graph/badge.svg?token=P5sRpM4U6k)](https://codecov.io/gh/liveintent-berlin/live-connect)

### Features
Minify and concatenate JavaScript
- **ES6+ via Babel**  
ES6+ support using [Babel](https://babeljs.io/). ES6+ source code will be automatically transpiled to ES5 for wide browser support.
Pollyfill will also be taken care of automatically, if enabled.

### Running Browserstack tests
Tests are setting the cookies on eTLD+1 domain. For that, execute this command once:
```echo "127.0.0.1 bln.test.liveintent.com" | sudo tee -a /etc/hosts && echo "127.0.0.1 test.liveintent.com" | sudo tee -a /etc/hosts && echo "127.0.0.1 me.idex.com"  | sudo tee -a /etc/hosts```

Add Browserstack keys to your env, where the setup would be as follows:
```
user: process.env.BS_USER,
key: process.env.BS_KEY,
```
or, run Borwserstack tests locally, run:
```BS_USER=${User} BS_KEY=${Key} npm run test:it:browserstack```

### Babel & Rollup
We use Rollup to bundle our code, which is then piped through Babel. Main Babel config is in `babel.config.js`.
Currently, no polyfills will be included in the bundle.
Babel will transpile the code to work with browsers specified in the `.browserslistrc` file.

### Quick start
- With [npm](https://www.npmjs.com/): `npm install`
- Build for production: `npm run build`
- Format the code according to the eslint file: `npm run fix-js`
- Run unit tests: `npm run test:unit`
- Run integration tests against a dockerized chrome: `npm run test:it:docker:chrome`
- Run full integration tests on multiple browsers: `npm run test:it:browserstack`

## GitHub Releases

The "Releases" tab on GitHub projects links to a page to store the changelog cq. release notes. To add
[GitHub releases](https://help.github.com/articles/creating-releases/) in your release-it flow:

- Configure `github.release: true`.
- Obtain a [personal access token](https://github.com/settings/tokens) (release-it only needs "repo" access; no "admin"
  or other scopes).
- Make sure the token is available as an environment variable. Example:

```bash
export GITHUB_TOKEN="f941e0..."
```

→ See [GitHub Releases](./docs/github-releases.md) for more details.

# Main concepts
LiveConnect module is used to gather first party identifiers of your choosing, and sends that information to a defined endpoint which is responsible for gathering an processing that data. 
What LiveConnect provides is a simple interface to collect the identifiers from a page, and gather user interactions along with those identifiers.

That being said, relevant pieces worth mentioning would be:

## Initialisation
The initialisation part should be straight forward, considering the snippet:
```$javascript
const liveConnect = require('./live-connect')
const lc = liveConnect.LiveConnect(configOptions)
```
What is returned after initialisation (`lc` in the snippet above) is an object exposing the following functions:
- `push` accepts a custom event one would like to keep track of.
- `fire` just fires a pixel, and can be considered as a simple page view
- `peopleVerifiedId` returns the most likely first party cookie that can be used for identity resolution
- `ready` flag, saying that the LC was loaded and ready.
- `resolve` function accepts a callback and an additional object with key value pairs. Of course, errors during resolution will be emitted on the EventBus and sent to the collector. The last parameter is `additionalParameters` which is an object, and will be attached to the IdentityResolution request, split into key-value pairs. The purpose of this object is to include key-value pairs in the request, e.g. for identifiers that cannot be found in the cookie jar, or in LocalStorage, or simply there's a requirement for a certain identifier to be represented under a specific key which doesn't match it's name in the cookie jar, or LocalStorage key. 

### Configuration options
Considering the snippet above, LiveConnect accepts a JSON with the config which determines its behaviour.

#### `appId` [Optional]
This parameter is a legacy one, and describes the relation between a website, and LiveIntent's media business entities.
This field does not have the default value. If it is not set, the appId calculation can be done server side, on the collector.
Example:
```javascript
{
  appId:"a-00xx"
}
```
#### `wrapperName` [Optional]
This parametr should be used when this module is required/imported in within another tracker. Often times, we'd like to separate the events received from a specific library encapsulating LiveConnect. If that is the case, it's recommended to set this parameter accordingly.
Example
```javascript
{
  wrapperName:"prebid"
}
```
#### `storageStrategy` [Optional, HasDefault]
This parameter defines whether the first party identifiers that LiveConnect creates and updates are stored in a cookie jar, or in local storage. If nothing is set, default behaviour would be `cookie`.
Example for storing the identifiers in a cookie jar:
```javascript
{
  storageStrategy: 'cookie'
}
```
or if putting the identifier in local storage is an option:
```javascript
{
  storageStrategy: 'localStorage'
}
```
There's also an option for the module to never create any first party identifiers, and that can be achieved by setting this parameter as follows:
```javascript
{
  storageStrategy: 'none'
}
```
#### `providedIdentifierName` [Optional]
This parameter defines the name of an identifier that can be found in local storage or in the cookie jar that can be sent along with the request.
This parameter should be used whenever a customer is able to provide the most stable identifier possible, e.g. a cookie which is et via HttpHeaders on the first party domain.

```javascript
{
  providedIdentifierName:"pubcid"
}
```
#### `collectorUrl` [Optional, HasDefault]
The parameter defines where the signal pixels are pointing to. The params and paths will be defined subsequently.
If the parameter is not set, LiveConnect will by default emit the signal towards `https://rp.liadm.com`.
The collectorUrl can be any service that can understand the query parameter structure LiveConnect emits.


Example:
```javascript
{
  collectorUrl:"https://rp.liadm.com"
}
```
#### `usPrivacyString` [Optional]
The IAB (https://iabtechlab.com/standards/ccpa/) privacy string that will be sent along with each request.

Example:
```javascript
{
  usPrivacyString:"1YYY"
}
```
#### `expirationDays` [Optional, HasDefault]
The expiration time of an identifier created and updated by LiveConnect.
By default, 730 days.

Example:
```javascript
{
  expirationDays:729
}
```
#### `identifiersToResolve` [Optional]
The names of identifiers which can be found in local storage or in the cookie jar. Those key-value pairs will be sent along with the request.

Example:
```javascript
{
  identifiersToResolve:["tdid","some-fpc"]
}
```
#### `trackerName` [Optional, HasDefault]
You might want multiple trackerNames on the page, so this can be the used to separate multiple use cases. By default, LC will use the version of this module.
The default value will be taken from `package.json` if it's not set.
Example:
```javascript
{
  trackerName:"v1.0.1"
}
```

#### `identityResolutionConfig` [Optional, HasDefault]
LiveConnect module comes with a functionality to resolve all the identifiers set in the `identifiersToResolve`, additionally to the first party ones created by LiveConnect (in case `storageStrategy` is anything else than `none`, and an actual identifier has been stored).
This configuration setting consists of the following

##### `identityResolutionConfig.url` [Optional, HasDefault]
By default, `https://idx.liadm.com/idex`.
This parameter can be in case you might have a specific CNAME per customer, so you can change settings between websites accordingly
Example:
```javascript
{
  identityResolutionConfig: {
    url: 'https://publisher.liveintent.com/idex'
  }
}
```

##### `identityResolutionConfig.expirationDays` [Optional, HasDefault]
By default, 1 day.
This configuration parameter determines the expiration of a result stored in previous `liveConnect.resolve (...)` calls. The result is stored in a cookie. 
Example:
```javascript
{
  identityResolutionConfig: {
    expirationDays: 4
  }
}
```
sets the cookie expiration time to 4 days, which means that in a given browser, the LiveIntent stable id will be reused for 4 days until it's refreshed.

##### `identityResolutionConfig.ajaxTimeout` [Optional, HasDefault]
By default, 1000 milliseconds.
This configuration parameter the maximum duration of a call to the IdentityResolution endpoint, after which the callback passed to the `resolve` function will be invoked. 
Example:
```javascript
{
  identityResolutionConfig: {
    ajaxTimeout: 400
  }
}
```
sets the timeout to 400 millis.

##### `identityResolutionConfig.source` [Optional, HasDefault]
By default, `unknown`.
This parameter can be used to differentiate the source of the calls to the IdentityResolution endpoint, in case your IdentityResolution endpoint is capturing multiple wrappers containing LiveConnect.
Example:
```javascript
{
  identityResolutionConfig: {
    source: 'prebid'
  }
}
```

##### `identityResolutionConfig.publisherId` [Optional, HasDefault]
By default, `any`.
This parameter can be used to track the specific publisher/website that's making use of the stable id returned by the IdentityResolution endpoint.
Example:
```javascript
{
  identityResolutionConfig: {
    source: 'prebid'
  }
}
```


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
`enrichers/page.js` holds the logic which determines the real page url on which we're trying to capture user interactions

### Cookies enrichment
`enrichers/identifiers.js` is responsible for reading the `identifiersToResolve` configuration parameter to read any additional identifiers that customers want to share with us.

## Messaging between components via EventBus (`__li__evt_bus`) 
LiveConnect exposes an object on the window level (`window.__li_evt_bus`) which is responsible for communicating various information based on different fields of interests.
For example, there are three topics which anyone can hook to, and receive information about:
- errors, on the `li_errors` topic
- whenever the pixel is sent successfully, the `lips` topic will emit that information
- just before the pixel is sent, `pre_lips` topic will contain the information about it.

The following snippets can be used to hook up to one of the topics and receive events as they happen.
```javascript
const lipsLogger = (message) => {console.info('Received a lips message, will continue receiving them', message)}
window.__li_evt_bus.on('lips', logger)
```
or
```javascript
const lipsLogger = (message) => {console.info('Received a lips message once, i will self destruct now.', message)}
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

## Sending pixel signal
The user interaction is sent to a url specified in the inbound config, as `collectorUrl`, only if the information is present.
For example, one of the parameters is `aid` which should send the value of the `appId` from the config, however, if it is not set, it will not be sent.
### Query parameters in use:
#### `aid`
- contains the `appId`
#### `se`
- contains the b64 url encoded string of the JSON that was sent via `liveConnect.push` function
#### `duid`
- contains the LiveConnect managed first party identifier, in the `${apexDomainHash}--${ULID}`, or `${iframeDomainHash}-${websiteUrlDomainHash}--${ULID}` format
#### `lduid`
- contains the legacy LiveConnect first party identifier
#### `pfpi`
- contains the value of the provided first party identifier (e.g the cookie found for key = `config.providedIdentifierName`)
#### `fpn`
- contains the name passed as the key of the provided first party identifier, specifically the value of the `config.providedIdentifierName`
#### `tna`
- contains the `config.trackerName`
#### `pu`
- the url on which the event happened, which is populated by the `page` enricher
#### `ae`
- contains a b64 encoded string of the JSON received on handled exceptions
#### `scre`
- if one of the identifiersToResolve contains plain emails, we don't want to send that over the wire, so those are hashed and passed under the `scre` param
#### `li_duid`
- contains a comma separated list of decision ids extracted from the url and decision storage
#### `e`
- similarly to `scre`, some information that is pushed to LiveConnect might contain clear text emails. Those are then hashed and sent under this field
#### `wpn`
- `config.wrapperName` value
#### `ext_` parameters
- `config.identifiersToResolve` are considered as external, so for each identifier specified and found in any storage level, an additional `ext_` key value pair will be added.
#### `us_privacy`
- the value of the `config.usPrivacyString` config parameter.
#### `dtstmp`
- the UTC timestamp when the pixel was sent

### Example of a request to a default collectorUrl:
`https://rp.liadm.com/p?tna=v1.0.16&aid=a-00co&lduid=a-00co--bda8cda1-9000-4632-8c64-06e04fa8d113&duid=df9f30ab37f2--01dwcepmbbbqm0hvj4wytvyss4&pu=https%3A%2F%2Fwww.example.com%2F&se=eyJldmVudCI6InZpZXdIb21lUGFnZSJ9&dtstmp=1577968744235`


