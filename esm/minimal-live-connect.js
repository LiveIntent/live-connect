const EVENT_BUS_NAMESPACE = '__li__evt_bus';
const ERRORS_PREFIX = 'li_errors';
const PEOPLE_VERIFIED_LS_ENTRY = '_li_duid';
const DEFAULT_IDEX_AJAX_TIMEOUT = 5000;
const DEFAULT_IDEX_URL = 'https://idx.liadm.com/idex';

function _emit (prefix, message) {
  window && window[EVENT_BUS_NAMESPACE] && window[EVENT_BUS_NAMESPACE].emit(prefix, message);
}
function fromError (name, exception) {
  error(name, exception.message, exception);
}
function error (name, message, e = {}) {
  const wrapped = new Error(message || e.message);
  wrapped.stack = e.stack;
  wrapped.name = name || 'unknown error';
  wrapped.lineNumber = e.lineNumber;
  wrapped.columnNumber = e.columnNumber;
  _emit(ERRORS_PREFIX, wrapped);
}

function enrich (state, storageHandler) {
  try {
    return { peopleVerifiedId: storageHandler.getDataFromLocalStorage(PEOPLE_VERIFIED_LS_ENTRY) }
  } catch (e) {
    error('E.PV', e.message, e);
    return {}
  }
}

function safeToString (value) {
  return typeof value === 'object' ? JSON.stringify(value) : ('' + value)
}
function isNonEmpty (value) {
  return typeof value !== 'undefined' && value !== null && trim(value).length > 0
}
function isArray (arr) {
  return Object.prototype.toString.call(arr) === '[object Array]'
}
const hasTrim = !!String.prototype.trim;
function trim (value) {
  return hasTrim ? ('' + value).trim() : ('' + value).replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')
}
function isString (str) {
  return typeof str === 'string'
}
function strEqualsIgnoreCase (fistStr, secondStr) {
  return isString(fistStr) && isString(secondStr) && trim(fistStr.toLowerCase()) === trim(secondStr.toLowerCase())
}
function isObject (obj) {
  return !!obj && typeof obj === 'object' && !isArray(obj)
}
function isFunction (fun) {
  return fun && typeof fun === 'function'
}

const toParams = (tuples) => {
  let acc = '';
  tuples.forEach((tuple) => {
    const operator = acc.length === 0 ? '?' : '&';
    if (tuple && tuple.length && tuple.length === 2 && tuple[0] && tuple[1]) {
      acc = `${acc}${operator}${tuple[0]}=${tuple[1]}`;
    }
  });
  return acc
};

function _responseReceived (storageHandler, successCallback) {
  return response => {
    let responseObj = {};
    if (response) {
      try {
        responseObj = JSON.parse(response);
      } catch (ex) {
        fromError('IdentityResolverParser', ex);
      }
    }
    successCallback(responseObj);
  }
}
const _additionalParams = (params) => {
  if (params && isObject(params)) {
    const array = [];
    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value && !isObject(value) && value.length) {
        array.push([encodeURIComponent(key), encodeURIComponent(value)]);
      }
    });
    return array
  } else {
    return []
  }
};
function _asParamOrEmpty (param, value, transform) {
  if (isNonEmpty(value)) {
    return [param, transform(value)]
  } else {
    return []
  }
}
function IdentityResolver (config, storageHandler, calls) {
  try {
    const nonNullConfig = config || {};
    const idexConfig = nonNullConfig.identityResolutionConfig || {};
    const externalIds = nonNullConfig.retrievedIdentifiers || [];
    const source = idexConfig.source || 'unknown';
    const publisherId = idexConfig.publisherId || 'any';
    const url = idexConfig.url || DEFAULT_IDEX_URL;
    const timeout = idexConfig.ajaxTimeout || DEFAULT_IDEX_AJAX_TIMEOUT;
    const tuples = [];
    tuples.push(_asParamOrEmpty('duid', nonNullConfig.peopleVerifiedId, encodeURIComponent));
    tuples.push(_asParamOrEmpty('us_privacy', nonNullConfig.usPrivacyString, encodeURIComponent));
    tuples.push(_asParamOrEmpty('gdpr', nonNullConfig.gdprApplies, v => encodeURIComponent(v ? 1 : 0)));
    tuples.push(_asParamOrEmpty('gdpr_consent', nonNullConfig.gdprConsent, encodeURIComponent));
    externalIds.forEach(retrievedIdentifier => {
      tuples.push(_asParamOrEmpty(retrievedIdentifier.name, retrievedIdentifier.value, encodeURIComponent));
    });
    const composeUrl = (additionalParams) => {
      const originalParams = tuples.slice().concat(_additionalParams(additionalParams));
      const params = toParams(originalParams);
      return `${url}/${source}/${publisherId}${params}`
    };
    const unsafeResolve = (successCallback, errorCallback, additionalParams) => {
      calls.ajaxGet(composeUrl(additionalParams), _responseReceived(storageHandler, successCallback), errorCallback, timeout);
    };
    return {
      resolve: (successCallback, errorCallback, additionalParams) => {
        try {
          unsafeResolve(successCallback, errorCallback, additionalParams);
        } catch (e) {
          errorCallback();
          fromError('IdentityResolve', e);
        }
      },
      getUrl: (additionalParams) => composeUrl(additionalParams)
    }
  } catch (e) {
    fromError('IdentityResolver', e);
    return {
      resolve: (successCallback, errorCallback) => {
        errorCallback();
        fromError('IdentityResolver.resolve', e);
      },
      getUrl: () => {
        fromError('IdentityResolver.getUrl', e);
      }
    }
  }
}

const emailLikeRegex = /"([^"]+(@|%40)[^"]+[.][a-z]*(\s+)?)(\\"|")/;
function containsEmailField (s) {
  return emailLikeRegex.test(s)
}

function enrich$1 (state, storageHandler) {
  try {
    return _parseIdentifiersToResolve(state, storageHandler)
  } catch (e) {
    fromError('IdentifiersEnrich', e);
    return {}
  }
}
function _parseIdentifiersToResolve (state, storageHandler) {
  state.identifiersToResolve = state.identifiersToResolve || [];
  const cookieNames = isArray(state.identifiersToResolve) ? state.identifiersToResolve : safeToString(state.identifiersToResolve).split(',');
  const identifiers = [];
  for (let i = 0; i < cookieNames.length; i++) {
    const identifierName = trim(cookieNames[i]);
    const identifierValue = storageHandler.getCookie(identifierName) || storageHandler.getDataFromLocalStorage(identifierName);
    if (identifierValue && !containsEmailField(safeToString(identifierValue))) {
      identifiers.push({
        name: identifierName,
        value: identifierValue
      });
    }
  }
  return {
    retrievedIdentifiers: identifiers
  }
}

const StorageStrategy = {
  cookie: 'cookie',
  localStorage: 'ls',
  none: 'none'
};

const _noOp = () => undefined;
function StorageHandler (storageStrategy, externalStorageHandler) {
  const errors = [];
  function _externalOrError (functionName) {
    const hasExternal = externalStorageHandler && externalStorageHandler[functionName] && isFunction(externalStorageHandler[functionName]);
    if (hasExternal) {
      return externalStorageHandler[functionName]
    } else {
      errors.push(functionName);
      return _noOp
    }
  }
  const _orElseNoOp = (fName) => strEqualsIgnoreCase(storageStrategy, StorageStrategy.none) ? _noOp : _externalOrError(fName);
  const handler = {
    localStorageIsEnabled: _orElseNoOp('localStorageIsEnabled'),
    getCookie: _externalOrError('getCookie'),
    getDataFromLocalStorage: _externalOrError('getDataFromLocalStorage')
  };
  if (errors.length > 0) {
    error('StorageHandler', `The storage functions '${JSON.stringify(errors)}' are not provided`);
  }
  return handler
}

const _noOp$1 = () => undefined;
function CallHandler (externalCallHandler) {
  const errors = [];
  function _externalOrError (functionName) {
    const hasExternal = externalCallHandler && externalCallHandler[functionName] && isFunction(externalCallHandler[functionName]);
    if (hasExternal) {
      return externalCallHandler[functionName]
    } else {
      errors.push(functionName);
      return _noOp$1
    }
  }
  const handler = {
    ajaxGet: _externalOrError('ajaxGet'),
    pixelGet: _externalOrError('pixelGet')
  };
  if (errors.length > 0) {
    error('CallHandler', `The call functions '${JSON.stringify(errors)}' are not provided`);
  }
  return handler
}

function _standardInitialization (liveConnectConfig, externalStorageHandler, externalCallHandler) {
  try {
    const callHandler = CallHandler(externalCallHandler);
    const storageHandler = StorageHandler(liveConnectConfig.storageStrategy, externalStorageHandler);
    const peopleVerifiedData = enrich(liveConnectConfig, storageHandler);
    const finalData = { ...peopleVerifiedData, ...enrich$1(liveConnectConfig, storageHandler) };
    const resolver = IdentityResolver(finalData, storageHandler, callHandler);
    return {
      push: window.liQ.push,
      fire: () => window.liQ.push({}),
      peopleVerifiedId: peopleVerifiedData.peopleVerifiedId,
      ready: true,
      resolve: resolver.resolve,
      resolutionCallUrl: resolver.getUrl,
      config: liveConnectConfig
    }
  } catch (x) {
  }
}
function MinimalLiveConnect (liveConnectConfig, externalStorageHandler, externalCallHandler) {
  try {
    window.liQ = window.liQ || [];
    const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {};
    return _standardInitialization(configuration, externalStorageHandler, externalCallHandler)
  } catch (x) {
  }
  return {}
}

export { MinimalLiveConnect };
