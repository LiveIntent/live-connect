function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

var UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
var uuidRegex = new RegExp("^".concat(UUID, "$"), 'i');
/**
 * @param {*} value
 * @returns {string}
 */

function safeToString(value) {
  return _typeof(value) === 'object' ? JSON.stringify(value) : '' + value;
}
/**
 * Checks whether the param NOT `null` and NOT `undefined`
 * @param {*} value
 * @returns {boolean}
 */

function isNonEmpty(value) {
  return typeof value !== 'undefined' && value !== null && trim(value).length > 0;
}
function isUUID(value) {
  return value && uuidRegex.test(trim(value));
}
/**
 * @param {*} arr
 * @returns {boolean}
 */

function isArray(arr) {
  return Object.prototype.toString.call(arr) === '[object Array]';
}
var hasTrim = !!String.prototype.trim;
/**
 * @param value
 * @return {string}
 */

function trim(value) {
  return hasTrim ? ('' + value).trim() : ('' + value).replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
}
/**
 * @param {*} str
 * @returns {boolean}
 */

function isString(str) {
  return typeof str === 'string';
}
/**
 * @param fistStr
 * @param secondStr
 * @return {boolean}
 */

function strEqualsIgnoreCase(fistStr, secondStr) {
  return isString(fistStr) && isString(secondStr) && trim(fistStr.toLowerCase()) === trim(secondStr.toLowerCase());
}
/**
 * @param obj
 * @return {boolean}
 */

function isObject(obj) {
  return !!obj && _typeof(obj) === 'object' && !isArray(obj);
}
/**
 * @param fun
 * @return {boolean}
 */

function isFunction(fun) {
  return fun && typeof fun === 'function';
}
/**
 * Returns the string representation when something should expire
 * @param expires
 * @return {string}
 */

function expiresInDays(expires) {
  return _expires(expires, 864e5);
}
/**
 * Returns the string representation when something should expire
 * @param expires
 * @return {string}
 */

function expiresInHours(expires) {
  return _expires(expires, 36e5);
}

function _expires(expires, times) {
  return new Date(new Date().getTime() + expires * times).toUTCString();
}

var EVENT_BUS_NAMESPACE = '__li__evt_bus';
var ERRORS_PREFIX = 'li_errors';
var PIXEL_SENT_PREFIX = 'lips';
var PRELOAD_PIXEL = 'pre_lips';

function _emit(prefix, message) {
  window && window[EVENT_BUS_NAMESPACE] && window[EVENT_BUS_NAMESPACE].emit(prefix, message);
}

function send(prefix, message) {
  _emit(prefix, message);
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

var DEFAULT_AJAX_TIMEOUT = 0;
/**
 * @param {LiveConnectConfiguration} liveConnectConfig
 * @param {CallHandler} calls
 * @param {function} onload
 * @param {function} presend
 * @returns {{sendAjax: *, sendPixel: *}}
 * @constructor
 */

function PixelSender(liveConnectConfig, calls, onload, presend) {
  var url = liveConnectConfig && liveConnectConfig.collectorUrl || 'https://rp.liadm.com';
  /**
   * @param {StateWrapper} state
   * @private
   */

  function _sendAjax(state) {
    _sendState(state, 'j', function (uri) {
      calls.ajaxGet(uri, function (bakersJson) {
        if (isFunction(onload)) onload();

        _callBakers(bakersJson);
      }, function (e) {
        _sendPixel(state);

        error('AjaxFailed', e.message, e);
      }, DEFAULT_AJAX_TIMEOUT);
    });
  }

  function _callBakers(bakersJson) {
    try {
      var bakers = JSON.parse(bakersJson).bakers;

      if (isArray(bakers)) {
        for (var i = 0; i < bakers.length; i++) {
          calls.pixelGet("".concat(bakers[i], "?dtstmp=").concat(utcMillis()));
        }
      }
    } catch (e) {
      error('CallBakers', 'Error while calling bakers', e);
    }
  }
  /**
   * @param {StateWrapper} state
   * @private
   */


  function _sendPixel(state) {
    _sendState(state, 'p', function (uri) {
      return calls.pixelGet(uri, onload);
    });
  }

  function _sendState(state, endpoint, makeCall) {
    if (state.sendsPixel()) {
      if (isFunction(presend)) {
        presend();
      }

      var latest = "dtstmp=".concat(utcMillis());
      var queryString = state.asQueryString();
      var withDt = queryString ? "&".concat(latest) : "?".concat(latest);
      var uri = "".concat(url, "/").concat(endpoint).concat(queryString).concat(withDt);
      makeCall(uri);
    }
  }

  function utcMillis() {
    var now = new Date();
    return new Date(now.toUTCString()).getTime() + now.getMilliseconds();
  }

  return {
    sendAjax: _sendAjax,
    sendPixel: _sendPixel
  };
}

/**
 * btoa() as defined by the HTML and Infra specs, which mostly just references
 * RFC 4648.
 */
function btoa(s) {
  var i; // String conversion as required by Web IDL.

  s = "".concat(s); // "The btoa() method must throw an "InvalidCharacterError" DOMException if
  // data contains any character whose code point is greater than U+00FF."

  for (i = 0; i < s.length; i++) {
    if (s.charCodeAt(i) > 255) {
      return null;
    }
  }

  var out = '';

  for (i = 0; i < s.length; i += 3) {
    var groupsOfSix = [undefined, undefined, undefined, undefined];
    groupsOfSix[0] = s.charCodeAt(i) >> 2;
    groupsOfSix[1] = (s.charCodeAt(i) & 0x03) << 4;

    if (s.length > i + 1) {
      groupsOfSix[1] |= s.charCodeAt(i + 1) >> 4;
      groupsOfSix[2] = (s.charCodeAt(i + 1) & 0x0f) << 2;
    }

    if (s.length > i + 2) {
      groupsOfSix[2] |= s.charCodeAt(i + 2) >> 6;
      groupsOfSix[3] = s.charCodeAt(i + 2) & 0x3f;
    }

    for (var j = 0; j < groupsOfSix.length; j++) {
      if (typeof groupsOfSix[j] === 'undefined') {
        out += '=';
      } else {
        out += btoaLookup(groupsOfSix[j]);
      }
    }
  }

  return out;
}
/**
 * Lookup table for btoa(), which converts a six-bit number into the
 * corresponding ASCII character.
 */

function btoaLookup(idx) {
  if (idx < 26) {
    return String.fromCharCode(idx + 'A'.charCodeAt(0));
  }

  if (idx < 52) {
    return String.fromCharCode(idx - 26 + 'a'.charCodeAt(0));
  }

  if (idx < 62) {
    return String.fromCharCode(idx - 52 + '0'.charCodeAt(0));
  }

  if (idx === 62) {
    return '+';
  }

  if (idx === 63) {
    return '/';
  } // Throw INVALID_CHARACTER_ERR exception here -- won't be hit in the tests.


  return undefined;
}

/**
 * @type {RegExp}
 * @private
 */

var _base64encodeRegex = /[+/]|=+$/g;
/**
 * @param {string} s
 * @returns {string}
 * @private
 */

function _safeBtoa(s) {
  return btoa(s) || '';
}
/**
 * @type {{'+': string, '/': string}}
 * @private
 */


var _base64ToUrlEncodedChars = {
  '+': '-',
  '/': '_'
};
/**
 * @param {char} x
 * @returns {*|string}
 * @private
 */

function _replaceBase64Chars(x) {
  return _base64ToUrlEncodedChars[x] || '';
}
/**
 * @param {string} s
 * @returns {*}
 */


function base64UrlEncode(s) {
  var btoa = null; // First we escape the string using encodeURIComponent to get the UTF-8 encoding of the characters,
  // then we convert the percent encodings into raw bytes, and finally feed it to btoa() function.

  var utf8Bytes = encodeURIComponent(s).replace(/%([0-9A-F]{2})/g, function (match, p1) {
    return String.fromCharCode('0x' + p1);
  });

  try {
    btoa = window && isFunction(window.btoa) ? window.btoa : _safeBtoa;
  } catch (e) {
    btoa = _safeBtoa;
  }

  return btoa(utf8Bytes).replace(_base64encodeRegex, _replaceBase64Chars);
}

var emailRegex = function emailRegex() {
  return /\S+(@|%40)\S+\.\S+/;
};

var emailLikeRegex = /"([^"]+(@|%40)[^"]+[.][a-z]*(\s+)?)(\\"|")/;
var multipleEmailLikeRegex = new RegExp(emailLikeRegex.source, 'g');
/**
 * @param {string} s
 * @returns {boolean}
 */

function isEmail(s) {
  return emailRegex().test(s);
}
/**
 * @param {string} s
 * @returns {boolean}
 */

function containsEmailField(s) {
  return emailLikeRegex.test(s);
}
function extractEmail(s) {
  var result = s.match(emailRegex());
  return result && result.map(trim)[0];
}
/**
 * @param {string} s
 * @returns {string[]}
 */

function listEmailsInString(s) {
  var result = [];
  var current = multipleEmailLikeRegex.exec(s);

  while (current) {
    result.push(trim(current[1]));
    current = multipleEmailLikeRegex.exec(s);
  }

  return result;
}

var MASK = '*********';
function replacer(key, value) {
  if (typeof value === 'string' && isEmail(trim(value))) {
    return MASK;
  } else {
    return value;
  }
}

for (var r = [], o = 0; o < 64;) {
  r[o] = 0 | 4294967296 * Math.sin(++o % Math.PI);
}

function md5 (t) {
  var e,
      f,
      n,
      a = [e = 1732584193, f = 4023233417, ~e, ~f],
      c = [],
      h = unescape(encodeURI(t)) + "",
      u = h.length;

  for (t = --u / 4 + 2 | 15, c[--t] = 8 * u; ~u;) {
    c[u >> 2] |= h.charCodeAt(u) << 8 * u--;
  }

  for (o = h = 0; o < t; o += 16) {
    for (u = a; h < 64; u = [n = u[3], e + ((n = u[0] + [e & f | ~e & n, n & e | ~n & f, e ^ f ^ n, f ^ (e | ~n)][u = h >> 4] + r[h] + ~~c[o | 15 & [h, 5 * h + 1, 3 * h + 5, 7 * h][u]]) << (u = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21][4 * u + h++ % 4]) | n >>> -u), e, f]) {
      e = 0 | u[1], f = u[2];
    }

    for (h = 4; h;) {
      a[--h] += u[h];
    }
  }

  for (t = ""; h < 32;) {
    t += (a[h >> 3] >> 4 * (1 ^ h++) & 15).toString(16);
  }

  return t;
}

function sha1 (r) {
  var o,
      e,
      t,
      f,
      n,
      a = [],
      c = [e = 1732584193, t = 4023233417, ~e, ~t, 3285377520],
      u = [],
      d = unescape(encodeURI(r)) + "",
      g = d.length;

  for (u[r = --g / 4 + 2 | 15] = 8 * g; ~g;) {
    u[g >> 2] |= d.charCodeAt(g) << 8 * ~g--;
  }

  for (o = g = 0; o < r; o += 16) {
    for (e = c; g < 80; e = [e[4] + (a[g] = g < 16 ? ~~u[o + g] : 2 * d | d < 0) + 1518500249 + [t & f | ~t & n, d = 341275144 + (t ^ f ^ n), 882459459 + (t & f | t & n | f & n), d + 1535694389][g++ / 5 >> 2] + ((d = e[0]) << 5 | d >>> 27), d, t << 30 | t >>> 2, f, n]) {
      d = a[g - 3] ^ a[g - 8] ^ a[g - 14] ^ a[g - 16], t = e[1], f = e[2], n = e[3];
    }

    for (g = 5; g;) {
      c[--g] += e[g];
    }
  }

  for (d = ""; g < 40;) {
    d += (c[g >> 3] >> 4 * (7 - g++) & 15).toString(16);
  }

  return d;
}

for (var r$1, o$1 = 18, n = [], t = []; o$1 > 1; o$1--) {
  for (r$1 = o$1; r$1 < 320;) {
    n[r$1 += o$1] = 1;
  }
}

function e(r, o) {
  return 4294967296 * Math.pow(r, 1 / o) | 0;
}

for (r$1 = 0; r$1 < 64;) {
  n[++o$1] || (t[r$1] = e(o$1, 2), n[r$1++] = e(o$1, 3));
}

function f(r, o) {
  return r >>> o | r << -o;
}

function sha256 (u) {
  var c = t.slice(o$1 = r$1 = 0, 8),
      i = [],
      a = unescape(encodeURI(u)) + "",
      p = a.length;

  for (i[u = --p / 4 + 2 | 15] = 8 * p; ~p;) {
    i[p >> 2] |= a.charCodeAt(p) << 8 * ~p--;
  }

  for (p = []; o$1 < u; o$1 += 16) {
    for (e = c.slice(); r$1 < 64; e.unshift(a + (f(a = e[0], 2) ^ f(a, 13) ^ f(a, 22)) + (a & e[1] ^ e[1] & e[2] ^ e[2] & a))) {
      e[3] += a = 0 | (p[r$1] = r$1 < 16 ? ~~i[r$1 + o$1] : (f(a = p[r$1 - 2], 17) ^ f(a, 19) ^ a >>> 10) + p[r$1 - 7] + (f(a = p[r$1 - 15], 7) ^ f(a, 18) ^ a >>> 3) + p[r$1 - 16]) + e.pop() + (f(a = e[4], 6) ^ f(a, 11) ^ f(a, 25)) + (a & e[5] ^ ~a & e[6]) + n[r$1++];
    }

    for (r$1 = 8; r$1;) {
      c[--r$1] += e[r$1];
    }
  }

  for (a = ""; r$1 < 64;) {
    a += (c[r$1 >> 3] >> 4 * (7 - r$1++) & 15).toString(16);
  }

  return a;
}

/**
 * @typedef {Object} HashedEmail
 * @property {string} md5
 * @property {string} sha1
 * @property {string} sha256
 */

var hashLikeRegex = function hashLikeRegex() {
  return /(\s+)?[a-f0-9]{32,64}(\s+)?/gi;
};

var lengthToHashType = {
  32: 'md5',
  40: 'sha1',
  64: 'sha256'
};
function isHash(hash) {
  var extractedHash = extractHashValue(hash);
  return !!extractedHash && lengthToHashType[extractedHash.length] != null;
}
function extractHashValue(s) {
  var result = s.match(hashLikeRegex());
  return result && result.map(trim)[0];
}
/**
 * @param {string} email
 * @returns {HashedEmail}
 */

function hashEmail(email) {
  var lowerCasedEmail = email.toLowerCase();
  return {
    md5: md5(lowerCasedEmail),
    sha1: sha1(lowerCasedEmail),
    sha256: sha256(lowerCasedEmail)
  };
}
/**
 * @param {string} domain
 * @param limit
 * @returns {string}
 */

function domainHash(domain) {
  var limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 12;
  return sha1(domain.replace(/^\./, '')).substring(0, limit);
}

var MAX_ITEMS = 10;
var LIMITING_KEYS = ['items', 'itemids'];
var HASH_BEARERS = ['email', 'emailhash', 'hash', 'hashedemail'];

function _provided(state) {
  var eventSource = state.eventSource;
  var objectKeys = Object.keys(eventSource);

  for (var _i = 0, _objectKeys = objectKeys; _i < _objectKeys.length; _i++) {
    var key = _objectKeys[_i];
    var lowerCased = key.toLowerCase();

    if (HASH_BEARERS.indexOf(lowerCased) > -1) {
      var value = trim(safeToString(eventSource[key]));
      var extractedEmail = extractEmail(value);
      var extractedHash = extractHashValue(value);

      if (extractedEmail) {
        var hashes = hashEmail(decodeURIComponent(extractedEmail));
        var hashesArray = [hashes.md5, hashes.sha1, hashes.sha256];
        return _objectSpread2(_objectSpread2({}, {
          hashedEmail: hashesArray
        }), state);
      } else if (extractedHash && isHash(extractedHash)) {
        var _hashesArray = [extractedHash.toLowerCase()];
        return _objectSpread2(_objectSpread2({}, {
          hashedEmail: _hashesArray
        }), state);
      }
    }
  }

  return state;
}

function _itemsLimiter(state) {
  var event = state.eventSource;
  Object.keys(event).forEach(function (key) {
    var lowerCased = key.toLowerCase();

    if (LIMITING_KEYS.indexOf(lowerCased) > -1 && isArray(event[key]) && event[key].length > MAX_ITEMS) {
      event[key].length = MAX_ITEMS;
    }
  });
  return {};
}

var fiddlers = [_provided, _itemsLimiter];
function fiddle(state) {
  var reducer = function reducer(accumulator, func) {
    return _objectSpread2(_objectSpread2({}, accumulator), func(accumulator));
  };

  if (isObject(state.eventSource)) {
    return fiddlers.reduce(reducer, state);
  } else {
    return state;
  }
}

var toParams = function toParams(tuples) {
  var acc = '';
  tuples.forEach(function (tuple) {
    var operator = '';

    if (acc.length === 0) {
      operator = '?';
    } else {
      operator = '&';
    }

    if (tuple && tuple.length && tuple.length === 2 && tuple[0] && tuple[1]) {
      acc = "".concat(acc).concat(operator).concat(tuple[0], "=").concat(tuple[1]);
    }
  });
  return acc;
};

function _decode(s) {
  return s.indexOf('%') === -1 ? s : decodeURIComponent(s);
}

function _isNum(v) {
  return isNaN(+v) ? v : +v;
}

function _isNull(v) {
  return v === 'null' || v === 'undefined' ? null : v;
}

function _isBoolean(v) {
  return v === 'false' ? false : v === 'true' ? true : v;
}

function _convert(v) {
  return _isBoolean(_isNull(_isNum(v)));
}

function urlParams(url) {
  var questionMarkIndex, queryParams, historyIndex;
  var obj = {};

  if (!url || (questionMarkIndex = url.indexOf('?')) === -1 || !(queryParams = url.slice(questionMarkIndex + 1))) {
    return obj;
  }

  if ((historyIndex = queryParams.indexOf('#')) !== -1 && !(queryParams = queryParams.slice(0, historyIndex))) {
    return obj;
  }

  queryParams.split('&').forEach(function (query) {
    if (query) {
      query = ((query = query.split('=')) && query.length === 2 ? query : [query[0], 'true']).map(_decode);
      if (query[0].slice(-2) === '[]') obj[query[0] = query[0].slice(0, -2)] = obj[query[0]] || [];
      if (!obj[query[0]]) return obj[query[0]] = _convert(query[1]);

      if (isArray(obj[query[0]])) {
        obj[query[0]].push(_convert(query[1]));
      } else {
        obj[query[0]] = [obj[query[0]], _convert(query[1])];
      }
    }
  });
  return obj;
}

/**
 * @param {string} param
 * @param {string|null} value
 * @param {function} transform
 * @return {*[]|Array}
 * @private
 */

var noOpEvents = ['setemail', 'setemailhash', 'sethashedemail'];

function _asParamOrEmpty(param, value, transform) {
  if (isNonEmpty(value)) {
    return [param, isFunction(transform) ? transform(value) : value];
  } else {
    return [];
  }
}

function _param(key, value) {
  return _asParamOrEmpty(key, value, function (s) {
    return encodeURIComponent(s);
  });
}

var _pMap = {
  appId: function appId(aid) {
    return _param('aid', aid);
  },
  eventSource: function eventSource(source) {
    return _asParamOrEmpty('se', source, function (s) {
      return base64UrlEncode(JSON.stringify(s, replacer));
    });
  },
  liveConnectId: function liveConnectId(fpc) {
    return _param('duid', fpc);
  },
  legacyId: function legacyId(legacyFpc) {
    return _param('lduid', legacyFpc && legacyFpc.duid);
  },
  trackerName: function trackerName(tn) {
    return _param('tna', tn || 'unknown');
  },
  pageUrl: function pageUrl(purl) {
    return _param('pu', purl);
  },
  errorDetails: function errorDetails(ed) {
    return _asParamOrEmpty('ae', ed, function (s) {
      return base64UrlEncode(JSON.stringify(s));
    });
  },
  retrievedIdentifiers: function retrievedIdentifiers(identifiers) {
    var identifierParams = [];

    for (var i = 0; i < identifiers.length; i++) {
      identifierParams.push(_asParamOrEmpty("ext_".concat(identifiers[i].name), identifiers[i].value, function (s) {
        return encodeURIComponent(s);
      }));
    }

    return identifierParams;
  },
  hashesFromIdentifiers: function hashesFromIdentifiers(hashes) {
    var hashParams = [];

    for (var i = 0; i < hashes.length; i++) {
      hashParams.push(_asParamOrEmpty('scre', hashes[i], function (h) {
        return "".concat(h.md5, ",").concat(h.sha1, ",").concat(h.sha256);
      }));
    }

    return hashParams;
  },
  decisionIds: function decisionIds(dids) {
    return _param('li_did', dids.join(','));
  },
  hashedEmail: function hashedEmail(he) {
    return _param('e', he.join(','));
  },
  usPrivacyString: function usPrivacyString(usps) {
    return _param('us_privacy', usps && encodeURIComponent(usps));
  },
  wrapperName: function wrapperName(wrapper) {
    return _param('wpn', wrapper && encodeURIComponent(wrapper));
  },
  gdprApplies: function gdprApplies(_gdprApplies) {
    return _asParamOrEmpty('gdpr', _gdprApplies, function (s) {
      return encodeURIComponent(s ? 1 : 0);
    });
  },
  gdprConsent: function gdprConsent(gdprConsentString) {
    return _param('gdpr_consent', gdprConsentString && encodeURIComponent(gdprConsentString));
  },
  referrer: function referrer(_referrer) {
    return _param('refr', _referrer);
  }
};
/**
 * @param {State} state
 * @returns {StateWrapper}
 * @constructor
 */

function StateWrapper(state) {
  /**
   * @type {State}
   */
  var _state = {};

  if (state) {
    _state = _safeFiddle(state);
  }

  function _sendsPixel() {
    var eventKeys = Object.keys(isObject(_state.eventSource) ? _state.eventSource : {}).filter(function (objKey) {
      return objKey.toLowerCase() === 'eventname' || objKey.toLowerCase() === 'event';
    });
    var eventKey = eventKeys && eventKeys.length >= 1 && eventKeys[0];
    var eventName = eventKey && trim(_state.eventSource[eventKey]);
    return !eventName || noOpEvents.indexOf(eventName.toLowerCase()) === -1;
  }

  function _safeFiddle(newInfo) {
    try {
      return fiddle(JSON.parse(JSON.stringify(newInfo)));
    } catch (e) {
      error('StateCombineWith', 'Error while extracting event data', e);
      return _state;
    }
  }
  /**
   * @param {State} newInfo
   * @return {StateWrapper}
   * @private
   */


  function _combineWith(newInfo) {
    return new StateWrapper(_objectSpread2(_objectSpread2({}, _state), newInfo));
  }
  /**
   * @returns {string [][]}
   * @private
   */


  function _asTuples() {
    var array = [];
    Object.keys(_state).forEach(function (key) {
      var value = _state[key];

      if (_pMap[key]) {
        var params = _pMap[key](value);

        if (params && params.length) {
          if (params[0] instanceof Array) {
            array = array.concat(params);
          } else {
            array.push(params);
          }
        }
      }
    });
    return array;
  }
  /**
   * @returns {string}
   * @private
   */


  function _asQueryString() {
    return toParams(_asTuples());
  }

  return {
    data: _state,
    combineWith: _combineWith,
    asQueryString: _asQueryString,
    asTuples: _asTuples,
    sendsPixel: _sendsPixel
  };
}

var ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
var ENCODING_LEN = ENCODING.length;
var TIME_MAX = Math.pow(2, 48) - 1;
var TIME_LEN = 10;
var RANDOM_LEN = 16;
var prng = detectPrng();
/**
 * creates and logs the error message
 * @function
 * @param {string} message
 * @returns {Error}
 */

function createError(message) {
  var err = new Error(message);
  err.source = 'Ulid';
  return err;
}
/**
 * detects the pseudorandom number generator and generates the random number
 * @function
 * @returns {function} a random number generator
 */


function detectPrng() {
  var root = typeof window !== 'undefined' ? window : null;
  var browserCrypto = root && (root.crypto || root.msCrypto);

  if (browserCrypto) {
    return function () {
      var buffer = new Uint8Array(1);
      browserCrypto.getRandomValues(buffer);
      return buffer[0] / 0xff;
    };
  }

  return function () {
    return Math.random();
  };
}
/**
 * encodes the time based on the length
 * @param now
 * @param len
 * @returns {string} encoded time.
 */


function encodeTime(now, len) {
  if (now > TIME_MAX) {
    throw createError('cannot encode time greater than ' + TIME_MAX);
  }

  var mod;
  var str = '';

  for (; len > 0; len--) {
    mod = now % ENCODING_LEN;
    str = ENCODING.charAt(mod) + str;
    now = (now - mod) / ENCODING_LEN;
  }

  return str;
}
/**
 * encodes random character
 * @param len
 * @returns {string}
 */


function encodeRandom(len) {
  var str = '';

  for (; len > 0; len--) {
    str = randomChar() + str;
  }

  return str;
}
/**
 * gets a a random charcter from generated pseudorandom number
 * @returns {string}
 */


function randomChar() {
  var rand = Math.floor(prng() * ENCODING_LEN);

  if (rand === ENCODING_LEN) {
    rand = ENCODING_LEN - 1;
  }

  return ENCODING.charAt(rand);
}
/**
 * the factory to generate unique identifier based on time and current pseudorandom number
 */


function ulid() {
  return encodeTime(Date.now(), TIME_LEN) + encodeRandom(RANDOM_LEN);
}

/**
 * @return {string}
 */
function loadedDomain() {
  return document.domain || document.location && document.location.host || window && window.location && window.location.host || 'localhost';
}
/**
 * @return {string|undefined}
 */

function getReferrer() {
  var win = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window;
  return _safeGet(function () {
    return win.top.document.referrer;
  });
}
/**
 * @return {string|undefined}
 */

function getPage() {
  var win = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window;
  var ancestorOrigins = _safeGet(function () {
    return win.location.ancestorOrigins;
  }) || {};
  var windows = [];
  var currentWindow = win;

  while (currentWindow !== top) {
    windows.push(currentWindow);
    currentWindow = currentWindow.parent;
  }

  windows.push(currentWindow);
  var detectedPageUrl;

  var _loop = function _loop(i) {
    detectedPageUrl = _safeGet(function () {
      return windows[i].location.href;
    });

    if (i !== 0) {
      if (!detectedPageUrl) detectedPageUrl = _safeGet(function () {
        return windows[i - 1].document.referrer;
      });
      if (!detectedPageUrl) detectedPageUrl = ancestorOrigins[i - 1];
    }
  };

  for (var i = windows.length - 1; i >= 0 && !detectedPageUrl; i--) {
    _loop(i);
  }

  return detectedPageUrl;
}

function _safeGet(getter) {
  try {
    return getter();
  } catch (e) {
    return undefined;
  }
}

/**
 * @typedef {Object} StorageStrategy
 * @type {{cookie: string, localStorage: string, none: string}}
 */
var StorageStrategy = {
  cookie: 'cookie',
  localStorage: 'ls',
  none: 'none'
};

var NEXT_GEN_FP_NAME = '_lc2_fpi';
var TLD_CACHE_KEY = '_li_dcdm_c';
var DEFAULT_EXPIRATION_DAYS = 730;
/**
 * @param {State} state
 * @param {StorageHandler} storageHandler
 */

function resolve(state, storageHandler) {
  try {

    var determineTld = function determineTld() {
      var cachedDomain = storageHandler.getCookie(TLD_CACHE_KEY);

      if (cachedDomain) {
        return cachedDomain;
      }

      var domain = loadedDomain();
      var arr = domain.split('.').reverse();

      for (var i = 1; i < arr.length; i++) {
        var newD = ".".concat(arr.slice(0, i).reverse().join('.'));
        storageHandler.setCookie(TLD_CACHE_KEY, newD, undefined, 'Lax', newD);

        if (storageHandler.getCookie(TLD_CACHE_KEY)) {
          return newD;
        }
      }

      return ".".concat(domain);
    };

    var addDays = function addDays(days) {
      return new Date().getTime() + days * 864e5;
    };

    var lsGetOrAdd = function lsGetOrAdd(key, value, storageOptions) {
      var ret = null;

      try {
        if (storageHandler.localStorageIsEnabled()) {
          var expirationKey = "".concat(key, "_exp");
          var oldLsExpirationEntry = storageHandler.getDataFromLocalStorage(expirationKey);

          var _expiry = addDays(storageOptions.expires);

          if (oldLsExpirationEntry && parseInt(oldLsExpirationEntry) <= new Date().getTime()) {
            storageHandler.removeDataFromLocalStorage(key);
          }

          var oldLsEntry = storageHandler.getDataFromLocalStorage(key);

          if (!oldLsEntry) {
            storageHandler.setDataInLocalStorage(key, value);
          }

          storageHandler.setDataInLocalStorage(expirationKey, "".concat(_expiry));
          ret = storageHandler.getDataFromLocalStorage(key);
        }
      } catch (e) {
        error('LSGetOrAdd', 'Error manipulating LS', e);
      }

      return ret;
    };

    var cookieGetOrAdd = function cookieGetOrAdd(key, value, storageOptions) {
      var ret = null;

      try {
        var oldCookie = storageHandler.getCookie(key);

        if (oldCookie) {
          storageHandler.setCookie(key, oldCookie, expiresInDays(storageOptions.expires), 'Lax', storageOptions.domain);
        } else {
          storageHandler.setCookie(key, value, expiresInDays(storageOptions.expires), 'Lax', storageOptions.domain);
        }

        ret = storageHandler.getCookie(key);
      } catch (e) {
        error('CookieGetOrAdd', 'Failed manipulating cookie jar', e);
      }

      return ret;
    };

    var getOrAddWithExpiration = function getOrAddWithExpiration(key, value, storageOptions, storageStrategy) {
      if (strEqualsIgnoreCase(storageStrategy, StorageStrategy.localStorage)) {
        return lsGetOrAdd(key, value, storageOptions);
      } else if (strEqualsIgnoreCase(storageStrategy, StorageStrategy.none)) {
        return null;
      } else {
        return cookieGetOrAdd(key, value, storageOptions);
      }
    };
    /**
     * @param {string} apexDomain
     * @returns {string}
     * @private
     */


    var generateCookie = function generateCookie(apexDomain) {
      var cookie = "".concat(domainHash(apexDomain), "--").concat(ulid());
      return cookie.toLocaleLowerCase();
    };

    var expiry = state.expirationDays || DEFAULT_EXPIRATION_DAYS;
    var cookieDomain = determineTld();
    var storageOptions = {
      expires: expiry,
      domain: cookieDomain
    };
    var liveConnectIdentifier = getOrAddWithExpiration(NEXT_GEN_FP_NAME, generateCookie(cookieDomain), storageOptions, state.storageStrategy);
    return {
      domain: cookieDomain,
      liveConnectId: liveConnectIdentifier
    };
  } catch (e) {
    error('IdentifiersResolve', 'Error while managing identifiers', e);
    return {};
  }
}

var DEFAULT_DECISION_ID_COOKIE_EXPIRES = expiresInDays(30);
var DECISION_ID_QUERY_PARAM_NAME = 'li_did';
var DECISION_ID_COOKIE_NAMESPACE = 'lidids.';

var _onlyUnique = function _onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
};

var _validUuid = function _validUuid(value) {
  return isUUID(value);
};

var _nonEmpty = function _nonEmpty(value) {
  return value && trim(value).length > 0;
};
/**
 * @param {State} state
 * @param {StorageHandler} storageHandler
 */


function resolve$1(state, storageHandler) {
  var ret = {};

  function _addDecisionId(key, cookieDomain) {
    if (key) {
      storageHandler.setCookie("".concat(DECISION_ID_COOKIE_NAMESPACE).concat(key), key, DEFAULT_DECISION_ID_COOKIE_EXPIRES, 'Lax', cookieDomain);
    }
  }

  try {
    var params = state.pageUrl && urlParams(state.pageUrl) || {};
    var freshDecisions = [].concat(params[DECISION_ID_QUERY_PARAM_NAME] || []);
    var storedDecisions = storageHandler.findSimilarCookies(DECISION_ID_COOKIE_NAMESPACE);
    freshDecisions.map(trim).filter(_nonEmpty).filter(_validUuid).filter(_onlyUnique).forEach(function (decision) {
      return _addDecisionId(decision, state.domain);
    });
    var allDecisions = freshDecisions.concat(storedDecisions).map(trim).filter(_nonEmpty).filter(_validUuid).filter(_onlyUnique);
    ret = {
      decisionIds: allDecisions
    };
  } catch (e) {
    error('DecisionsResolve', 'Error while managing decision ids', e);
  }

  return ret;
}

var REPLACEMENT_THRESHOLD_MILLIS = 181 * 864e5;
var PEOPLE_VERIFIED_LS_ENTRY = '_li_duid';

function _setPeopleVerifiedStore(id, storageHandler) {
  if (id) {
    storageHandler.setDataInLocalStorage(PEOPLE_VERIFIED_LS_ENTRY, id);
  }
}
/**
 * @param {State} state
 * @param {StorageHandler} storageHandler
 */


function resolve$2(state, storageHandler) {

  try {
    var timeBefore = (new Date().getTime() - REPLACEMENT_THRESHOLD_MILLIS) / 1000;
    var legacyIdentifier = state.legacyId || {};
    var lastVisit = legacyIdentifier.currVisitTs ? parseInt(legacyIdentifier.currVisitTs) : 0; // Only overwrite the peopleVerified id if the entry for the legacy identifier exists, and it's old

    if (legacyIdentifier.currVisitTs && timeBefore > lastVisit && state.liveConnectId) {
      _setPeopleVerifiedStore(state.liveConnectId, storageHandler);
    }

    if (!storageHandler.getDataFromLocalStorage(PEOPLE_VERIFIED_LS_ENTRY)) {
      _setPeopleVerifiedStore(legacyIdentifier.duid || state.liveConnectId, storageHandler);
    }

    return {
      peopleVerifiedId: storageHandler.getDataFromLocalStorage(PEOPLE_VERIFIED_LS_ENTRY)
    };
  } catch (e) {
    error('PeopleVerifiedResolve', 'Error while managing people verified', e);
    return {};
  }
}

/**
 * @typedef {Object} ReplayEmitter
 * @property {(function)} on
 * @property {(function)} once
 * @property {(function)} emit
 * @property {(function)} off
 */
function E(replaySize) {
  this.replaySize = parseInt(replaySize) || 5;
  this.handlers = {};
  this.queue = {};
}
E.prototype = {
  on: function on(name, callback, ctx) {
    (this.handlers[name] || (this.handlers[name] = [])).push({
      fn: callback,
      ctx: ctx
    });
    var eventQueueLen = (this.queue[name] || []).length;

    for (var i = 0; i < eventQueueLen; i++) {
      callback.apply(ctx, this.queue[name][i]);
    }

    return this;
  },
  once: function once(name, callback, ctx) {
    var self = this;
    var eventQueue = this.queue[name] || [];

    if (eventQueue.length > 0) {
      callback.apply(ctx, eventQueue[0]);
      return this;
    } else {
      var listener = function listener() {
        self.off(name, listener);
        callback.apply(ctx, arguments);
      };

      listener._ = callback;
      return this.on(name, listener, ctx);
    }
  },
  emit: function emit(name) {
    var data = [].slice.call(arguments, 1);
    var evtArr = (this.handlers[name] || []).slice();
    var i = 0;
    var len = evtArr.length;

    for (i; i < len; i++) {
      evtArr[i].fn.apply(evtArr[i].ctx, data);
    }

    var eventQueue = this.queue[name] || (this.queue[name] = []);

    if (eventQueue.length >= this.replaySize) {
      eventQueue.shift();
    }

    eventQueue.push(data);
    return this;
  },
  off: function off(name, callback) {
    var handlers = this.handlers[name];
    var liveEvents = [];

    if (handlers && callback) {
      for (var i = 0, len = handlers.length; i < len; i++) {
        if (handlers[i].fn !== callback && handlers[i].fn._ !== callback) {
          liveEvents.push(handlers[i]);
        }
      }
    }

    liveEvents.length ? this.handlers[name] = liveEvents : delete this.handlers[name];
    return this;
  }
};

/**
 * @param {number} size
 * @param {function} errorCallback
 * @return {ReplayEmitter}
 */

function init() {
  var size = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 5;
  var errorCallback = arguments.length > 1 ? arguments[1] : undefined;

  try {

    if (!window) {
      errorCallback(new Error('Bus can only be attached to the window, which is not present'));
    }

    if (window && !window[EVENT_BUS_NAMESPACE]) {
      window[EVENT_BUS_NAMESPACE] = new E(size);
    }

    return window[EVENT_BUS_NAMESPACE];
  } catch (e) {
    errorCallback(e);
  }
}

/**
 * @private
 */

var _currentPage = null;
/**
 * @param state
 * @return {{pageUrl: string|undefined, referrer: string|undefined}}
 */

function enrich(state) {
  if (!_currentPage) {
    _currentPage = {
      pageUrl: getPage(),
      referrer: getReferrer()
    };
  }

  return _currentPage;
}

var _state = null;
var _pixelSender = null;
var MAX_ERROR_FIELD_LENGTH = 120;
/**
 * @type {State}
 * @private
 */

var _defaultReturn = {
  errorDetails: {
    message: 'Unknown message',
    name: 'Unknown name'
  }
};

function _asInt(field) {
  try {
    var intValue = field * 1;
    return isNaN(intValue) ? undefined : intValue;
  } catch (_unused) {}
}

function _truncate(value) {
  try {
    if (value && value.length && value.length > MAX_ERROR_FIELD_LENGTH) {
      return "".concat(value.substr(0, MAX_ERROR_FIELD_LENGTH), "...");
    } else {
      return value;
    }
  } catch (_unused2) {}
}
/**
 * @param {Error} e
 * @return {State}
 */


function asErrorDetails(e) {
  if (e) {
    return {
      errorDetails: {
        message: _truncate(e.message),
        name: _truncate(e.name),
        stackTrace: _truncate(e.stack),
        lineNumber: _asInt(e.lineNumber),
        lineColumn: _asInt(e.lineColumn),
        fileName: _truncate(e.fileName)
      }
    };
  } else {
    return _defaultReturn;
  }
}
/**
 * @param {Error} error
 * @private
 */

function _pixelError(error) {

  if (_pixelSender) {
    _pixelSender.sendPixel(new StateWrapper(asErrorDetails(error)).combineWith(_state || {}).combineWith(enrich()));
  }
}

function register(state, callHandler) {
  try {

    if (window && window[EVENT_BUS_NAMESPACE] && isFunction(window[EVENT_BUS_NAMESPACE].on)) {
      window[EVENT_BUS_NAMESPACE].on(ERRORS_PREFIX, _pixelError);
    }

    _pixelSender = new PixelSender(state, callHandler);
    _state = state || {};
  } catch (e) {
  }
}

/**
 * @typedef {Object} RetrievedIdentifier
 * @property {string} name
 * @property {string} value
 */
/**
 * @param {State} state
 * @param {StorageHandler} storageHandler
 * @returns {{hashesFromIdentifiers: HashedEmail[], retrievedIdentifiers: RetrievedIdentifier[]} | {}}
 */

function enrich$1(state, storageHandler) {
  try {
    return _getIdentifiers(_parseIdentifiersToResolve(state), storageHandler);
  } catch (e) {
    error('IdentifiersEnricher', e.message, e);
    return {};
  }
}
/**
 * @param {State} state
 * @returns {string[]}
 * @private
 */

function _parseIdentifiersToResolve(state) {
  var cookieNames = [];

  if (state.identifiersToResolve) {
    if (isArray(state.identifiersToResolve)) {
      cookieNames = state.identifiersToResolve;
    } else if (isString(state.identifiersToResolve)) {
      cookieNames = state.identifiersToResolve.split(',');
    }
  }

  for (var i = 0; i < cookieNames.length; i++) {
    cookieNames[i] = cookieNames[i].trim();
  }

  return cookieNames;
}
/**
 * @param {string[]} cookieNames
 * @param {State} state
 * @param {StorageHandler} storageHandler
 * @returns {{hashesFromIdentifiers: HashedEmail[], retrievedIdentifiers: RetrievedIdentifier[]}}
 * @private
 */


function _getIdentifiers(cookieNames, storageHandler) {
  var identifiers = [];
  var hashes = [];

  for (var i = 0; i < cookieNames.length; i++) {
    var identifierName = cookieNames[i];
    var identifierValue = storageHandler.getCookie(identifierName) || storageHandler.getDataFromLocalStorage(identifierName);

    if (identifierValue) {
      var cookieAndHashes = _findAndReplaceRawEmails(safeToString(identifierValue));

      identifiers.push({
        name: identifierName,
        value: cookieAndHashes.identifierWithoutRawEmails
      });
      hashes = hashes.concat(cookieAndHashes.hashesFromIdentifier);
    }
  }

  return {
    retrievedIdentifiers: identifiers,
    hashesFromIdentifiers: _deduplicateHashes(hashes)
  };
}
/**
 * @param {string} cookieValue
 * @returns {{hashesFromIdentifier: HashedEmail[], identifierWithoutRawEmails: string}}
 * @private
 */


function _findAndReplaceRawEmails(cookieValue) {
  if (containsEmailField(cookieValue)) {
    return _replaceEmailsWithHashes(cookieValue);
  } else if (isEmail(cookieValue)) {
    var hashes = hashEmail(cookieValue);
    return {
      identifierWithoutRawEmails: hashes.md5,
      hashesFromIdentifier: [hashes]
    };
  } else {
    return {
      identifierWithoutRawEmails: cookieValue,
      hashesFromIdentifier: []
    };
  }
}
/**
 *
 * @param cookieValue
 * @returns {{hashesFromIdentifier: HashedEmail[], identifierWithoutRawEmails: string}}
 * @private
 */


function _replaceEmailsWithHashes(cookieValue) {
  var emailsInCookie = listEmailsInString(cookieValue);
  var hashes = [];

  for (var i = 0; i < emailsInCookie.length; i++) {
    var email = emailsInCookie[i];
    var emailHashes = hashEmail(email);
    cookieValue = cookieValue.replace(email, emailHashes.md5);
    hashes.push(emailHashes);
  }

  return {
    identifierWithoutRawEmails: cookieValue,
    hashesFromIdentifier: hashes
  };
}
/**
 * @param {HashedEmail[]} hashes
 * @returns {HashedEmail[]}
 * @private
 */


function _deduplicateHashes(hashes) {
  var seen = {};
  var result = [];

  for (var i = 0; i < hashes.length; i++) {
    if (!(hashes[i].md5 in seen)) {
      result.push(hashes[i]);
      seen[hashes[i].md5] = true;
    }
  }

  return result;
}

var APP_ID = '[a-z]-[a-z0-9]{4}';
var NUMBERS = '\\+?\\d+';
var LEGACY_COOKIE_FORMAT = "(".concat(APP_ID, "--").concat(UUID, ")\\.(").concat(NUMBERS, ")\\.(").concat(NUMBERS, ")\\.(").concat(NUMBERS, ")\\.(").concat(NUMBERS, ")\\.(").concat(UUID, ")");
var LEGACY_COOKIE_REGEX = new RegExp(LEGACY_COOKIE_FORMAT, 'i');
var LEGACY_IDENTIFIER_PREFIX = '_litra_id.';

function _fixupDomain(domain) {
  var dl = domain.length; // remove trailing '.'

  if (domain.charAt(--dl) === '.') {
    domain = domain.slice(0, dl);
  } // remove leading '*'


  if (domain.slice(0, 2) === '*.') {
    domain = domain.slice(1);
  }

  return domain;
}

function getLegacyIdentifierKey() {
  var domainKey = domainHash(_fixupDomain(loadedDomain()) + '/', 4);
  return "".concat(LEGACY_IDENTIFIER_PREFIX).concat(domainKey);
}
/**
 * @return {LegacyId|null|undefined}
 * @private
 */

function getLegacyId(entry) {
  if (entry) {
    var matches = entry.match(LEGACY_COOKIE_REGEX);

    if (matches && matches.length === 7) {
      return {
        duid: matches[1],
        creationTs: matches[2],
        sessionCount: matches[3],
        currVisitTs: matches[4],
        lastSessionVisitTs: matches[5],
        sessionId: matches[6]
      };
    }
  }
}

/**
 * @param {State} state
 * @param {StorageHandler} storageHandler
 */

function enrich$2(state, storageHandler) {

  try {
    return state.appId && storageHandler.localStorageIsEnabled() && {
      legacyId: getLegacyId(storageHandler.getDataFromLocalStorage(getLegacyIdentifierKey()))
    };
  } catch (e) {
    error('LegacyDuidEnrich', 'Error while getting legacy duid', e);
  }

  return {};
}

var IDEX_STORAGE_KEY = '__li_idex_cache';
var DEFAULT_IDEX_URL = 'https://idx.liadm.com/idex';
var DEFAULT_EXPIRATION_HOURS = 1;
var DEFAULT_AJAX_TIMEOUT$1 = 5000;

function _responseReceived(storageHandler, domain, expirationHours, successCallback) {
  return function (response) {
    var responseObj = {};

    if (response) {
      try {
        responseObj = JSON.parse(response);
      } catch (ex) {
        error('IdentityResolverParser', "Error parsing Idex response: ".concat(response), ex);
      }
    }

    try {
      storageHandler.setCookie(IDEX_STORAGE_KEY, JSON.stringify(responseObj), expiresInHours(expirationHours), 'Lax', domain);
    } catch (ex) {
      error('IdentityResolverStorage', 'Error putting the Idex response in a cookie jar', ex);
    }

    successCallback(responseObj);
  };
}

var _additionalParams = function _additionalParams(params) {
  if (params && isObject(params)) {
    var array = [];
    Object.keys(params).forEach(function (key) {
      var value = params[key];

      if (value && !isObject(value) && value.length) {
        array.push([encodeURIComponent(key), encodeURIComponent(value)]);
      }
    });
    return array;
  } else {
    return [];
  }
};

function _asParamOrEmpty$1(param, value, transform) {
  if (isNonEmpty(value)) {
    return [param, transform(value)];
  } else {
    return [];
  }
}
/**
 * @param {State} config
 * @param {StorageHandler} storageHandler
 * @param {CallHandler} calls
 * @return {{resolve: function(successCallback: function, errorCallback: function, additionalParams: Object), getUrl: function(additionalParams: Object)}}
 * @constructor
 */


function IdentityResolver(config, storageHandler, calls) {
  try {
    var nonNullConfig = config || {};
    var idexConfig = nonNullConfig.identityResolutionConfig || {};
    var externalIds = nonNullConfig.retrievedIdentifiers || [];
    var expirationHours = idexConfig.expirationHours || DEFAULT_EXPIRATION_HOURS;
    var source = idexConfig.source || 'unknown';
    var publisherId = idexConfig.publisherId || 'any';
    var url = idexConfig.url || DEFAULT_IDEX_URL;
    var timeout = idexConfig.ajaxTimeout || DEFAULT_AJAX_TIMEOUT$1;
    var tuples = [];
    tuples.push(_asParamOrEmpty$1('duid', nonNullConfig.peopleVerifiedId, encodeURIComponent));
    tuples.push(_asParamOrEmpty$1('us_privacy', nonNullConfig.usPrivacyString, encodeURIComponent));
    tuples.push(_asParamOrEmpty$1('gdpr', nonNullConfig.gdprApplies, function (v) {
      return encodeURIComponent(v ? 1 : 0);
    }));
    tuples.push(_asParamOrEmpty$1('gdpr_consent', nonNullConfig.gdprConsent, encodeURIComponent));
    externalIds.forEach(function (retrievedIdentifier) {
      tuples.push(_asParamOrEmpty$1(retrievedIdentifier.name, retrievedIdentifier.value, encodeURIComponent));
    });

    var composeUrl = function composeUrl(additionalParams) {
      var originalParams = tuples.slice().concat(_additionalParams(additionalParams));
      var params = toParams(originalParams);
      return "".concat(url, "/").concat(source, "/").concat(publisherId).concat(params);
    };

    var unsafeResolve = function unsafeResolve(successCallback, errorCallback, additionalParams) {
      var finalUrl = composeUrl(additionalParams);
      var storedCookie = storageHandler.getCookie(IDEX_STORAGE_KEY);

      if (storedCookie) {
        successCallback(JSON.parse(storedCookie));
      } else {
        calls.ajaxGet(finalUrl, _responseReceived(storageHandler, nonNullConfig.domain, expirationHours, successCallback), errorCallback, timeout);
      }
    };

    return {
      resolve: function resolve(successCallback, errorCallback, additionalParams) {
        try {
          unsafeResolve(successCallback, errorCallback, additionalParams);
        } catch (e) {
          errorCallback();
          error('IdentityResolve', 'Resolve threw an unhandled exception', e);
        }
      },
      getUrl: function getUrl(additionalParams) {
        return composeUrl(additionalParams);
      }
    };
  } catch (e) {
    error('IdentityResolver', 'IdentityResolver not created', e);
    return {
      resolve: function resolve(successCallback, errorCallback) {
        errorCallback();
        error('IdentityResolver.resolve', 'Resolve called on an uninitialised IdentityResolver', e);
      },
      getUrl: function getUrl() {
        error('IdentityResolver.getUrl', 'getUrl called on an uninitialised IdentityResolver', e);
      }
    };
  }
}

/**
 * @typedef {Object} StorageHandler
 * @property {function} [localStorageIsEnabled]
 * @property {function} [getCookie]
 * @property {function} [setCookie]
 * @property {function} [getDataFromLocalStorage]
 * @property {function} [removeDataFromLocalStorage]
 * @property {function} [setDataInLocalStorage]
 * @property {function} [findSimilarCookies]
 */

var _noOp = function _noOp() {
  return undefined;
};
/**
 *
 * @param {string} storageStrategy
 * @param {StorageHandler} [externalStorageHandler]
 * @return {StorageHandler}
 * @constructor
 */


function StorageHandler(storageStrategy, externalStorageHandler) {
  var errors = [];

  function _externalOrError(functionName) {
    var hasExternal = externalStorageHandler && externalStorageHandler[functionName] && isFunction(externalStorageHandler[functionName]);

    if (hasExternal) {
      return externalStorageHandler[functionName];
    } else {
      errors.push(functionName);
      return _noOp;
    }
  }

  var _orElseNoOp = function _orElseNoOp(fName) {
    return strEqualsIgnoreCase(storageStrategy, StorageStrategy.none) ? _noOp : _externalOrError(fName);
  };

  var handler = {
    localStorageIsEnabled: _orElseNoOp('localStorageIsEnabled'),
    getCookie: _externalOrError('getCookie'),
    setCookie: _orElseNoOp('setCookie'),
    getDataFromLocalStorage: _externalOrError('getDataFromLocalStorage'),
    removeDataFromLocalStorage: _orElseNoOp('removeDataFromLocalStorage'),
    setDataInLocalStorage: _orElseNoOp('setDataInLocalStorage'),
    findSimilarCookies: _externalOrError('findSimilarCookies')
  };

  if (errors.length > 0) {
    error('StorageHandler', "The storage functions '".concat(JSON.stringify(errors), "' are not provided"));
  }

  return handler;
}

/**
 * @typedef {Object} CallHandler
 * @property {function} [ajaxGet]
 * @property {function} [pixelGet]
 */

var _noOp$1 = function _noOp() {
  return undefined;
};
/**
 * @param {CallHandler} externalCallHandler
 * @returns {CallHandler}
 * @constructor
 */


function CallHandler(externalCallHandler) {
  var errors = [];

  function _externalOrError(functionName) {
    var hasExternal = externalCallHandler && externalCallHandler[functionName] && isFunction(externalCallHandler[functionName]);

    if (hasExternal) {
      return externalCallHandler[functionName];
    } else {
      errors.push(functionName);
      return _noOp$1;
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

var hemStore = {};

function _pushSingleEvent(event, pixelClient, enrichedState) {
  if (!event || !isObject(event)) {
    error('EventNotAnObject', 'Received event was not an object', new Error(event));
  } else if (event.config) {
    error('StrayConfig', 'Received a config after LC has already been initialised', new Error(event));
  } else {
    var combined = enrichedState.combineWith({
      eventSource: event
    });
    hemStore.hashedEmail = hemStore.hashedEmail || combined.data.hashedEmail;

    var withHemStore = _objectSpread2({
      eventSource: event
    }, hemStore);

    pixelClient.sendAjax(enrichedState.combineWith(withHemStore));
  }
}
/**
 *
 * @param {LiveConnectConfiguration} previousConfig
 * @param {LiveConnectConfiguration} newConfig
 * @return {Object|null}
 * @private
 */


function _configMatcher(previousConfig, newConfig) {
  var equalConfigs = previousConfig.appId === newConfig.appId && previousConfig.wrapperName === newConfig.wrapperName && previousConfig.collectorUrl === newConfig.collectorUrl;

  if (!equalConfigs) {
    return {
      appId: [previousConfig.appId, newConfig.appId],
      wrapperName: [previousConfig.wrapperName, newConfig.wrapperName],
      collectorUrl: [previousConfig.collectorUrl, newConfig.collectorUrl]
    };
  }
}

function _processArgs(args, pixelClient, enrichedState) {
  try {
    args.forEach(function (arg) {
      if (isArray(arg)) {
        arg.forEach(function (e) {
          return _pushSingleEvent(e, pixelClient, enrichedState);
        });
      } else {
        _pushSingleEvent(arg, pixelClient, enrichedState);
      }
    });
  } catch (e) {
    error('LCPush', 'Failed sending an event', e);
  }
}
/**
 *
 * @param {LiveConnectConfiguration} liveConnectConfig
 * @return {LiveConnect|null}
 * @private
 */


function _getInitializedLiveConnect(liveConnectConfig) {
  try {
    if (window && window.liQ && window.liQ.ready) {
      var mismatchedConfig = window.liQ.config && _configMatcher(window.liQ.config, liveConnectConfig);

      if (mismatchedConfig) {
        var error$1 = new Error('Additional configuration received');
        error$1.name = 'ConfigSent';
        error('LCDuplication', JSON.stringify(mismatchedConfig), error$1);
      }

      return window.liQ;
    }
  } catch (e) {
  }
}
/**
 * @param {LiveConnectConfiguration} liveConnectConfig
 * @param {StorageHandler} externalStorageHandler
 * @param {CallHandler} externalCallHandler
 * @returns {LiveConnect}
 * @private
 */


function _standardInitialization(liveConnectConfig, externalStorageHandler, externalCallHandler) {
  try {
    init();
    var callHandler = CallHandler(externalCallHandler);
    register(liveConnectConfig, callHandler);
    var storageHandler = StorageHandler(liveConnectConfig.storageStrategy, externalStorageHandler);

    var reducer = function reducer(accumulator, func) {
      return accumulator.combineWith(func(accumulator.data, storageHandler));
    };

    var enrichers = [enrich, enrich$1, enrich$2];
    var managers = [resolve, resolve$2, resolve$1];
    var enrichedState = enrichers.reduce(reducer, new StateWrapper(liveConnectConfig));
    var postManagedState = managers.reduce(reducer, enrichedState);

    var syncContainerData = _objectSpread2(_objectSpread2({}, liveConnectConfig), {
      peopleVerifiedId: postManagedState.data.peopleVerifiedId
    });

    var onPixelLoad = function onPixelLoad() {
      return send(PIXEL_SENT_PREFIX, syncContainerData);
    };

    var onPixelPreload = function onPixelPreload() {
      return send(PRELOAD_PIXEL, '0');
    };

    var pixelClient = new PixelSender(liveConnectConfig, callHandler, onPixelLoad, onPixelPreload);
    var resolver = IdentityResolver(postManagedState.data, storageHandler, callHandler);

    var _push = function _push() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _processArgs(args, pixelClient, postManagedState);
    };

    return {
      push: _push,
      fire: function fire() {
        return _push({});
      },
      peopleVerifiedId: postManagedState.data.peopleVerifiedId,
      ready: true,
      resolve: resolver.resolve,
      resolutionCallUrl: resolver.getUrl,
      config: liveConnectConfig
    };
  } catch (x) {
    error('LCConstruction', 'Failed to build LC', x);
  }
}
/**
 * @param {LiveConnectConfiguration} liveConnectConfig
 * @param {StorageHandler} externalStorageHandler
 * @param {CallHandler} externalCallHandler
 * @returns {LiveConnect}
 * @constructor
 */


function LiveConnect(liveConnectConfig, externalStorageHandler, externalCallHandler) {

  try {
    var queue = window.liQ || [];
    var configuration = isObject(liveConnectConfig) && liveConnectConfig || {};
    window && (window.liQ = _getInitializedLiveConnect(configuration) || _standardInitialization(configuration, externalStorageHandler, externalCallHandler) || queue);

    if (isArray(queue)) {
      for (var i = 0; i < queue.length; i++) {
        window.liQ.push(queue[i]);
      }
    }
  } catch (x) {
    error('LCConstruction', 'Failed to build LC', x);
  }

  return window.liQ;
}

export { LiveConnect };
