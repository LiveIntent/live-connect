'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _typeof(obj) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  }, _typeof(obj);
}

function safeToString(value) {
  return _typeof(value) === 'object' ? JSON.stringify(value) : '' + value;
}
function isNonEmpty(value) {
  return typeof value !== 'undefined' && value !== null && trim(value).length > 0;
}
function isArray(arr) {
  return Object.prototype.toString.call(arr) === '[object Array]';
}
var hasTrim = !!String.prototype.trim;
function trim(value) {
  return hasTrim ? ('' + value).trim() : ('' + value).replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
}
function isString(str) {
  return typeof str === 'string';
}
function strEqualsIgnoreCase(fistStr, secondStr) {
  return isString(fistStr) && isString(secondStr) && trim(fistStr.toLowerCase()) === trim(secondStr.toLowerCase());
}
function isObject(obj) {
  return !!obj && _typeof(obj) === 'object' && !isArray(obj);
}
function isFunction(fun) {
  return fun && typeof fun === 'function';
}
function asParamOrEmpty(param, value, transform) {
  return isNonEmpty(value) ? [param, isFunction(transform) ? transform(value) : value] : [];
}
function asStringParam(param, value) {
  return asParamOrEmpty(param, value, function (s) {
    return encodeURIComponent(s);
  });
}
function asStringParamWhen(param, value, predicate) {
  return isNonEmpty(value) && isFunction(predicate) && predicate(value) ? [param, encodeURIComponent(value)] : [];
}
function mapAsParams(paramsMap) {
  if (paramsMap && isObject(paramsMap)) {
    var array = [];
    Object.keys(paramsMap).forEach(function (key) {
      var value = paramsMap[key];
      if (value && !isObject(value) && value.length) {
        if (isArray(value)) {
          value.forEach(function (entry) {
            return array.push([encodeURIComponent(key), encodeURIComponent(entry)]);
          });
        } else {
          array.push([encodeURIComponent(key), encodeURIComponent(value)]);
        }
      }
    });
    return array;
  } else {
    return [];
  }
}
function merge(obj1, obj2) {
  var res = {};
  var clean = function clean(obj) {
    return isObject(obj) ? obj : {};
  };
  var first = clean(obj1);
  var second = clean(obj2);
  Object.keys(first).forEach(function (key) {
    res[key] = first[key];
  });
  Object.keys(second).forEach(function (key) {
    res[key] = second[key];
  });
  return res;
}

var EVENT_BUS_NAMESPACE = '__li__evt_bus';
var ERRORS_PREFIX = 'li_errors';
var PEOPLE_VERIFIED_LS_ENTRY = '_li_duid';
var DEFAULT_IDEX_AJAX_TIMEOUT = 5000;
var DEFAULT_IDEX_URL = 'https://idx.liadm.com/idex';
var DEFAULT_REQUESTED_ATTRIBUTES = [];

function _emit(prefix, message) {
  window && window[EVENT_BUS_NAMESPACE] && window[EVENT_BUS_NAMESPACE].emit(prefix, message);
}
function fromError(name, exception) {
  error(name, exception.message, exception);
}
function error(name, message) {
  var e = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var wrapped = new Error(message || e.message);
  wrapped.stack = e.stack;
  wrapped.name = name || 'unknown error';
  wrapped.lineNumber = e.lineNumber;
  wrapped.columnNumber = e.columnNumber;
  _emit(ERRORS_PREFIX, wrapped);
}

var toParams = function toParams(tuples) {
  var acc = '';
  tuples.forEach(function (tuple) {
    var operator = acc.length === 0 ? '?' : '&';
    if (tuple && tuple.length && tuple.length === 2 && tuple[0] && tuple[1]) {
      acc = "".concat(acc).concat(operator).concat(tuple[0], "=").concat(tuple[1]);
    }
  });
  return acc;
};

var noopCache = {
  get: function get(key) {
    return null;
  },
  set: function set(key, value, expiresAt) {
    return undefined;
  }
};
function makeIdentityResolver(config, calls, cache) {
  try {
    var idexConfig = config.identityResolutionConfig || {};
    var externalIds = config.retrievedIdentifiers || [];
    var source = idexConfig.source || 'unknown';
    var publisherId = idexConfig.publisherId || 'any';
    var url = idexConfig.url || DEFAULT_IDEX_URL;
    var timeout = idexConfig.ajaxTimeout || DEFAULT_IDEX_AJAX_TIMEOUT;
    var requestedAttributes = idexConfig.requestedAttributes || DEFAULT_REQUESTED_ATTRIBUTES;
    var tuples = [];
    tuples.push(asStringParam('duid', config.peopleVerifiedId));
    tuples.push(asStringParam('us_privacy', config.usPrivacyString));
    tuples.push(asParamOrEmpty('gdpr', config.gdprApplies, function (v) {
      return encodeURIComponent(v ? 1 : 0);
    }));
    tuples.push(asStringParamWhen('n3pc', config.privacyMode ? 1 : 0, function (v) {
      return v === 1;
    }));
    tuples.push(asStringParam('gdpr_consent', config.gdprConsent));
    externalIds.forEach(function (retrievedIdentifier) {
      tuples.push(asStringParam(retrievedIdentifier.name, retrievedIdentifier.value));
    });
    var attributeResolutionAllowed = function attributeResolutionAllowed(attribute) {
      if (attribute === 'uid2') {
        return !config.privacyMode;
      } else {
        return true;
      }
    };
    requestedAttributes.filter(attributeResolutionAllowed).forEach(function (requestedAttribute) {
      tuples.push(asStringParam('resolve', requestedAttribute));
    });
    var composeUrl = function composeUrl(additionalParams) {
      var originalParams = tuples.slice().concat(mapAsParams(additionalParams));
      var params = toParams(originalParams);
      return "".concat(url, "/").concat(source, "/").concat(publisherId).concat(params);
    };
    var responseReceived = function responseReceived(additionalParams, successCallback) {
      return function (responseText, response) {
        var responseObj = {};
        if (responseText) {
          try {
            responseObj = JSON.parse(responseText);
          } catch (ex) {
            fromError('IdentityResolverParser', ex);
          }
        }
        var expiresAt = responseExpires(response);
        cache.set(additionalParams, responseObj, expiresAt);
        successCallback(responseObj);
      };
    };
    var unsafeResolve = function unsafeResolve(successCallback, errorCallback, additionalParams) {
      var cachedValue = cache.get(additionalParams);
      if (cachedValue) {
        successCallback(cachedValue);
      } else {
        calls.ajaxGet(composeUrl(additionalParams), responseReceived(additionalParams, successCallback), errorCallback, timeout);
      }
    };
    return {
      resolve: function resolve(successCallback, errorCallback, additionalParams) {
        try {
          unsafeResolve(successCallback, errorCallback, additionalParams);
        } catch (e) {
          errorCallback();
          fromError('IdentityResolve', e);
        }
      },
      getUrl: function getUrl(additionalParams) {
        return composeUrl(additionalParams);
      }
    };
  } catch (e) {
    fromError('IdentityResolver', e);
    return {
      resolve: function resolve(successCallback, errorCallback) {
        errorCallback();
        fromError('IdentityResolver.resolve', e);
      },
      getUrl: function getUrl() {
        fromError('IdentityResolver.getUrl', e);
      }
    };
  }
}
function responseExpires(response) {
  if (response && isFunction(response.getResponseHeader)) {
    var expiresHeader = response.getResponseHeader('expires');
    if (expiresHeader) {
      return new Date(expiresHeader);
    }
  }
}

function IdentityResolver(config, calls) {
  return makeIdentityResolver(config || {}, calls, noopCache);
}

function enrich$2(state, storageHandler) {
  try {
    return {
      peopleVerifiedId: state.peopleVerifiedId || storageHandler.getDataFromLocalStorage(PEOPLE_VERIFIED_LS_ENTRY)
    };
  } catch (e) {
    error('PeopleVerifiedEnrich', e.message, e);
    return {};
  }
}

for (var r$1 = [], o$1 = 0; o$1 < 64;) {
  r$1[o$1] = 0 | 4294967296 * Math.sin(++o$1 % Math.PI);
}

for (var r, o = 18, n = [], t = []; o > 1; o--) {
  for (r = o; r < 320;) {
    n[r += o] = 1;
  }
}
function e(r, o) {
  return 4294967296 * Math.pow(r, 1 / o) | 0;
}
for (r = 0; r < 64;) {
  n[++o] || (t[r] = e(o, 2), n[r++] = e(o, 3));
}

var emailRegex = function emailRegex() {
  return /\S+(@|%40)\S+\.\S+/;
};
function isEmail(s) {
  return emailRegex().test(s);
}
function containsEmailField(s) {
  return emailRegex().test(s);
}

function enrich$1(state, storageHandler) {
  try {
    return _parseIdentifiersToResolve(state, storageHandler);
  } catch (e) {
    fromError('IdentifiersEnrich', e);
    return {};
  }
}
function _parseIdentifiersToResolve(state, storageHandler) {
  state.identifiersToResolve = state.identifiersToResolve || [];
  var cookieNames = isArray(state.identifiersToResolve) ? state.identifiersToResolve : safeToString(state.identifiersToResolve).split(',');
  var identifiers = [];
  for (var i = 0; i < cookieNames.length; i++) {
    var identifierName = trim(cookieNames[i]);
    var identifierValue = storageHandler.getCookie(identifierName) || storageHandler.getDataFromLocalStorage(identifierName);
    if (identifierValue && !containsEmailField(safeToString(identifierValue)) && !isEmail(safeToString(identifierValue))) {
      identifiers.push({
        name: identifierName,
        value: safeToString(identifierValue)
      });
    }
  }
  return {
    retrievedIdentifiers: identifiers
  };
}

function enrich(state) {
  if (isNonEmpty(state) && isNonEmpty(state.gdprApplies)) {
    var privacyMode = !!state.gdprApplies;
    return {
      privacyMode: privacyMode
    };
  } else return {};
}

var StorageStrategy = {
  cookie: 'cookie',
  localStorage: 'ls',
  none: 'none',
  disabled: 'disabled'
};

var _noOp$1 = function _noOp() {
  return undefined;
};
function StorageHandler(storageStrategy, externalStorageHandler) {
  var errors = [];
  function _externalOrError(functionName) {
    var hasExternal = externalStorageHandler && externalStorageHandler[functionName] && isFunction(externalStorageHandler[functionName]);
    if (strEqualsIgnoreCase(storageStrategy, StorageStrategy.disabled)) {
      return _noOp$1;
    } else if (hasExternal) {
      return externalStorageHandler[functionName];
    } else {
      errors.push(functionName);
      return _noOp$1;
    }
  }
  var _orElseNoOp = function _orElseNoOp(fName) {
    return strEqualsIgnoreCase(storageStrategy, StorageStrategy.none) ? _noOp$1 : _externalOrError(fName);
  };
  var handler = {
    localStorageIsEnabled: _orElseNoOp('localStorageIsEnabled'),
    getCookie: _externalOrError('getCookie'),
    getDataFromLocalStorage: _externalOrError('getDataFromLocalStorage')
  };
  if (errors.length > 0) {
    error('StorageHandler', "The storage functions '".concat(JSON.stringify(errors), "' are not provided"));
  }
  return handler;
}

var _noOp = function _noOp() {
  return undefined;
};
function CallHandler(externalCallHandler) {
  var errors = [];
  function _externalOrError(functionName) {
    var hasExternal = externalCallHandler && externalCallHandler[functionName] && isFunction(externalCallHandler[functionName]);
    if (hasExternal) {
      return externalCallHandler[functionName];
    } else {
      errors.push(functionName);
      return _noOp;
    }
  }
  var handler = {
    ajaxGet: _externalOrError('ajaxGet'),
    pixelGet: _externalOrError('pixelGet')
  };
  if (errors.length > 0) {
    error('CallHandler', "The call functions '".concat(JSON.stringify(errors), "' are not provided"));
  }
  return handler;
}

function _minimalInitialization(liveConnectConfig, externalStorageHandler, externalCallHandler) {
  try {
    var callHandler = CallHandler(externalCallHandler);
    var configWithPrivacy = merge(liveConnectConfig, enrich(liveConnectConfig));
    var storageStrategy = configWithPrivacy.privacyMode ? StorageStrategy.disabled : configWithPrivacy.storageStrategy;
    var storageHandler = StorageHandler(storageStrategy, externalStorageHandler);
    var peopleVerifiedData = merge(configWithPrivacy, enrich$2(configWithPrivacy, storageHandler));
    var peopleVerifiedDataWithAdditionalIds = merge(peopleVerifiedData, enrich$1(peopleVerifiedData, storageHandler));
    var resolver = IdentityResolver(peopleVerifiedDataWithAdditionalIds, callHandler);
    return {
      push: function push(arg) {
        return window.liQ.push(arg);
      },
      fire: function fire() {
        return window.liQ.push({});
      },
      peopleVerifiedId: peopleVerifiedDataWithAdditionalIds.peopleVerifiedId,
      ready: true,
      resolve: resolver.resolve,
      resolutionCallUrl: resolver.getUrl,
      config: liveConnectConfig
    };
  } catch (x) {
  }
}
function MinimalLiveConnect(liveConnectConfig, externalStorageHandler, externalCallHandler) {
  try {
    window && (window.liQ = window.liQ || []);
    var configuration = isObject(liveConnectConfig) && liveConnectConfig || {};
    return _minimalInitialization(configuration, externalStorageHandler, externalCallHandler);
  } catch (x) {
  }
  return {};
}

exports.MinimalLiveConnect = MinimalLiveConnect;
