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
  return new Date(new Date().getTime() + expires * 864e5).toUTCString();
}

/**
 * @param {LiveConnectConfiguration} liveConnectConfig
 * @param {function} onload
 * @returns {{send: *}}
 * @constructor
 */
function PixelSender(liveConnectConfig, onload, presend) {
  var url = liveConnectConfig && liveConnectConfig.collectorUrl || 'https://rp.liadm.com';
  /**
   * @param {StateWrapper} state
   * @private
   */

  function _send(state) {
    if (state.sendsPixel()) {
      if (isFunction(presend)) {
        presend();
      }

      var img = new window.Image();
      var now = new Date();
      var utcMillis = new Date(now.toUTCString()).getTime() + now.getMilliseconds();
      var latest = "dtstmp=".concat(utcMillis);
      var queryString = state.asQueryString();
      var withDt = queryString ? "&".concat(latest) : "?".concat(latest);
      img.src = "".concat(url, "/p").concat(queryString).concat(withDt);

      if (isFunction(onload)) {
        img.onload = onload;
      }
    }
  }

  return {
    send: _send
  };
}

/**
 * Implementation of atob() according to the HTML and Infra specs, except that
 * instead of throwing INVALID_CHARACTER_ERR we return null.
 */

function atob(data) {
  // Web IDL requires DOMStrings to just be converted using ECMAScript
  // ToString, which in our case amounts to using a template literal.
  data = "".concat(data); // "Remove all ASCII whitespace from data."

  data = data.replace(/[ \t\n\f\r]/g, ""); // "If data's length divides by 4 leaving no remainder, then: if data ends
  // with one or two U+003D (=) code points, then remove them from data."

  if (data.length % 4 === 0) {
    data = data.replace(/==?$/, "");
  } // "If data's length divides by 4 leaving a remainder of 1, then return
  // failure."
  //
  // "If data contains a code point that is not one of
  //
  // U+002B (+)
  // U+002F (/)
  // ASCII alphanumeric
  //
  // then return failure."


  if (data.length % 4 === 1 || /[^+/0-9A-Za-z]/.test(data)) {
    return null;
  } // "Let output be an empty byte sequence."


  var output = ""; // "Let buffer be an empty buffer that can have bits appended to it."
  //
  // We append bits via left-shift and or.  accumulatedBits is used to track
  // when we've gotten to 24 bits.

  var buffer = 0;
  var accumulatedBits = 0; // "Let position be a position variable for data, initially pointing at the
  // start of data."
  //
  // "While position does not point past the end of data:"

  for (var i = 0; i < data.length; i++) {
    // "Find the code point pointed to by position in the second column of
    // Table 1: The Base 64 Alphabet of RFC 4648. Let n be the number given in
    // the first cell of the same row.
    //
    // "Append to buffer the six bits corresponding to n, most significant bit
    // first."
    //
    // atobLookup() implements the table from RFC 4648.
    buffer <<= 6;
    buffer |= atobLookup(data[i]);
    accumulatedBits += 6; // "If buffer has accumulated 24 bits, interpret them as three 8-bit
    // big-endian numbers. Append three bytes with values equal to those
    // numbers to output, in the same order, and then empty buffer."

    if (accumulatedBits === 24) {
      output += String.fromCharCode((buffer & 0xff0000) >> 16);
      output += String.fromCharCode((buffer & 0xff00) >> 8);
      output += String.fromCharCode(buffer & 0xff);
      buffer = accumulatedBits = 0;
    } // "Advance position by 1."

  } // "If buffer is not empty, it contains either 12 or 18 bits. If it contains
  // 12 bits, then discard the last four and interpret the remaining eight as
  // an 8-bit big-endian number. If it contains 18 bits, then discard the last
  // two and interpret the remaining 16 as two 8-bit big-endian numbers. Append
  // the one or two bytes with values equal to those one or two numbers to
  // output, in the same order."


  if (accumulatedBits === 12) {
    buffer >>= 4;
    output += String.fromCharCode(buffer);
  } else if (accumulatedBits === 18) {
    buffer >>= 2;
    output += String.fromCharCode((buffer & 0xff00) >> 8);
    output += String.fromCharCode(buffer & 0xff);
  } // "Return output."


  return output;
}
/**
 * A lookup table for atob(), which converts an ASCII character to the
 * corresponding six-bit number.
 */


function atobLookup(chr) {
  if (/[A-Z]/.test(chr)) {
    return chr.charCodeAt(0) - "A".charCodeAt(0);
  }

  if (/[a-z]/.test(chr)) {
    return chr.charCodeAt(0) - "a".charCodeAt(0) + 26;
  }

  if (/[0-9]/.test(chr)) {
    return chr.charCodeAt(0) - "0".charCodeAt(0) + 52;
  }

  if (chr === "+") {
    return 62;
  }

  if (chr === "/") {
    return 63;
  } // Throw exception; should not be hit in tests


  return undefined;
}

var atob_1 = atob;

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

  var out = "";

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
      if (typeof groupsOfSix[j] === "undefined") {
        out += "=";
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
    return String.fromCharCode(idx + "A".charCodeAt(0));
  }

  if (idx < 52) {
    return String.fromCharCode(idx - 26 + "a".charCodeAt(0));
  }

  if (idx < 62) {
    return String.fromCharCode(idx - 52 + "0".charCodeAt(0));
  }

  if (idx === 62) {
    return "+";
  }

  if (idx === 63) {
    return "/";
  } // Throw INVALID_CHARACTER_ERR exception here -- won't be hit in the tests.


  return undefined;
}

var btoa_1 = btoa;

var abab = {
  atob: atob_1,
  btoa: btoa_1
};
var abab_2 = abab.btoa;

/**
 * @param {string} s
 * @returns {string}
 * @private
 */

function _safeBtoa(s) {
  var res = abab_2(s);
  return res || '';
}
/**
 * @type {RegExp}
 * @private
 */


var _base64encodeRegex = /[+/]|=+$/g;
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
function error(name, message, e) {
  var wrapped = new Error(message || e.message);
  wrapped.stack = e.stack;
  wrapped.name = name || 'unknown error';
  wrapped.lineNumber = e.lineNumber;
  wrapped.columnNumber = e.columnNumber;

  _emit(ERRORS_PREFIX, wrapped);
}

var emailRegex = function emailRegex() {
  return /\S+(@|%40)\S+\.\S+/;
};
/**
 * @param {string} s
 * @returns {boolean}
 */


function isEmail(s) {
  return emailRegex().test(s);
}
var emailLikeRegex = /"([^"]+(@|%40)[^"]+[.][a-z]*(\s+)?)(\\"|")/;
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
  var multipleEmailLikeRegex = new RegExp(emailLikeRegex.source, 'g');
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
  if (value && trim(value).length > 0) {
    return [param, isFunction(transform) ? transform(value) : value];
  } else {
    return [];
  }
}

var _pMap = {
  appId: function appId(aid) {
    return _asParamOrEmpty('aid', aid, function (s) {
      return encodeURIComponent(s);
    });
  },
  eventSource: function eventSource(source) {
    return _asParamOrEmpty('se', source, function (s) {
      return base64UrlEncode(JSON.stringify(s, replacer));
    });
  },
  liveConnectId: function liveConnectId(fpc) {
    return _asParamOrEmpty('duid', fpc, function (s) {
      return encodeURIComponent(s);
    });
  },
  legacyId: function legacyId(legacyFpc) {
    return _asParamOrEmpty('lduid', legacyFpc && legacyFpc.duid, function (s) {
      return encodeURIComponent(s);
    });
  },
  trackerName: function trackerName(tn) {
    return _asParamOrEmpty('tna', tn || 'unknown', function (s) {
      return encodeURIComponent(s);
    });
  },
  pageUrl: function pageUrl(purl) {
    return _asParamOrEmpty('pu', purl, function (s) {
      return encodeURIComponent(s);
    });
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
    return _asParamOrEmpty('li_did', dids.join(','), function (s) {
      return encodeURIComponent(s);
    });
  },
  hashedEmail: function hashedEmail(he) {
    return _asParamOrEmpty('e', he.join(','), function (s) {
      return encodeURIComponent(s);
    });
  },
  usPrivacyString: function usPrivacyString(usps) {
    return _asParamOrEmpty('us_privacy', encodeURIComponent(usps), function (s) {
      return encodeURIComponent(s);
    });
  },
  wrapperName: function wrapperName(wrapper) {
    return _asParamOrEmpty('wpn', encodeURIComponent(wrapper), function (s) {
      return encodeURIComponent(s);
    });
  },
  gdprApplies: function gdprApplies(_gdprApplies) {
    return _asParamOrEmpty('gdpr', encodeURIComponent(_gdprApplies), function (s) {
      return encodeURIComponent(s);
    });
  },
  gdprConsent: function gdprConsent(gdprConsentString) {
    return _asParamOrEmpty('gdpr_consent', encodeURIComponent(gdprConsentString), function (s) {
      return encodeURIComponent(s);
    });
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
    var source = isObject(_state.eventSource) ? _state.eventSource : {};
    var eventKeys = Object.keys(source).filter(function (objKey) {
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

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var dist = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, '__esModule', {
    value: true
  }); // These values should NEVER change. If
  // they do, we're no longer making ulids!

  var ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford's Base32

  var ENCODING_LEN = ENCODING.length;
  var TIME_MAX = Math.pow(2, 48) - 1;
  var TIME_LEN = 10;
  var RANDOM_LEN = 16;

  function createError(message) {
    var err = new Error(message);
    err.source = "ulid";
    return err;
  }

  function detectPrng(root) {
    if (!root) {
      root = typeof window !== "undefined" ? window : null;
    }

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

  function decodeTime(id) {
    if (id.length !== TIME_LEN + RANDOM_LEN) {
      throw createError("malformed ulid");
    }

    var time = id.substr(0, TIME_LEN).split("").reverse().reduce(function (carry, char, index) {
      var encodingIndex = ENCODING.indexOf(char);

      if (encodingIndex === -1) {
        throw createError("invalid character found: " + char);
      }

      return carry += encodingIndex * Math.pow(ENCODING_LEN, index);
    }, 0);

    if (time > TIME_MAX) {
      throw createError("malformed ulid, timestamp too large");
    }

    return time;
  }

  function encodeRandom(len, prng) {
    var str = "";

    for (; len > 0; len--) {
      str = randomChar(prng) + str;
    }

    return str;
  }

  function encodeTime(now, len) {
    if (isNaN(now)) {
      throw new Error(now + " must be a number");
    }

    if (now > TIME_MAX) {
      throw createError("cannot encode time greater than " + TIME_MAX);
    }

    if (now < 0) {
      throw createError("time must be positive");
    }

    if (isInteger(now) === false) {
      throw createError("time must be an integer");
    }

    var mod = void 0;
    var str = "";

    for (; len > 0; len--) {
      mod = now % ENCODING_LEN;
      str = ENCODING.charAt(mod) + str;
      now = (now - mod) / ENCODING_LEN;
    }

    return str;
  }

  function factory(currPrng) {
    if (!currPrng) {
      currPrng = detectPrng();
    }

    return function ulid(seedTime) {
      if (isNaN(seedTime)) {
        seedTime = Date.now();
      }

      return encodeTime(seedTime, TIME_LEN) + encodeRandom(RANDOM_LEN, currPrng);
    };
  }

  function incrementBase32(str) {
    var done = undefined;
    var index = str.length;
    var char = void 0;
    var charIndex = void 0;
    var maxCharIndex = ENCODING_LEN - 1;

    while (!done && index-- >= 0) {
      char = str[index];
      charIndex = ENCODING.indexOf(char);

      if (charIndex === -1) {
        throw createError("incorrectly encoded string");
      }

      if (charIndex === maxCharIndex) {
        str = replaceCharAt(str, index, ENCODING[0]);
        continue;
      }

      done = replaceCharAt(str, index, ENCODING[charIndex + 1]);
    }

    if (typeof done === "string") {
      return done;
    }

    throw createError("cannot increment this string");
  }

  function isInteger(value) {
    return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
  }

  function monotonicFactory(currPrng) {
    if (!currPrng) {
      currPrng = detectPrng();
    }

    var lastTime = 0;
    var lastRandom = void 0;
    return function ulid(seedTime) {
      if (isNaN(seedTime)) {
        seedTime = Date.now();
      }

      if (seedTime <= lastTime) {
        var incrementedRandom = lastRandom = incrementBase32(lastRandom);
        return encodeTime(lastTime, TIME_LEN) + incrementedRandom;
      }

      lastTime = seedTime;
      var newRandom = lastRandom = encodeRandom(RANDOM_LEN, currPrng);
      return encodeTime(seedTime, TIME_LEN) + newRandom;
    };
  }

  function randomChar(prng) {
    var rand = Math.floor(prng() * ENCODING_LEN);

    if (rand === ENCODING_LEN) {
      rand = ENCODING_LEN - 1;
    }

    return ENCODING.charAt(rand);
  }

  function replaceCharAt(str, index, char) {
    if (index > str.length - 1) {
      return str;
    }

    return str.substr(0, index) + char + str.substr(index + 1);
  } // Init


  var ulid = factory();
  exports.detectPrng = detectPrng;
  exports.decodeTime = decodeTime;
  exports.encodeRandom = encodeRandom;
  exports.encodeTime = encodeTime;
  exports.factory = factory;
  exports.incrementBase32 = incrementBase32;
  exports.monotonicFactory = monotonicFactory;
  exports.randomChar = randomChar;
  exports.replaceCharAt = replaceCharAt;
  exports.ulid = ulid;
});
unwrapExports(dist);
var dist_1 = dist.detectPrng;
var dist_2 = dist.decodeTime;
var dist_3 = dist.encodeRandom;
var dist_4 = dist.encodeTime;
var dist_5 = dist.factory;
var dist_6 = dist.incrementBase32;
var dist_7 = dist.monotonicFactory;
var dist_8 = dist.randomChar;
var dist_9 = dist.replaceCharAt;
var dist_10 = dist.ulid;

/**
 * @returns {boolean}
 */
function isIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}
/**
 * @returns {string}
 * @private
 */

function getPage() {
  try {
    return isIframe() ? document.referrer : document.location.href;
  } catch (e) {
    return document.location.href;
  }
}
/**
 * @return {string}
 */

function loadedDomain() {
  return document.domain || document.location && document.location.host || window && window.location && window.location.host || 'localhost';
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
        if (storageHandler.hasLocalStorage()) {
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
      var ulid = dist_10();
      var cookie = "".concat(domainHash(apexDomain), "--").concat(ulid);
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

function init(size, errorCallback) {
  if (!size) {
    size = 5;
  }

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
 * @return {{pageUrl: *}}
 */

function enrich(state) {
  if (!_currentPage) {
    _currentPage = getPage();
  }

  return {
    pageUrl: _currentPage
  };
}

var _state = null;
var _pixelSender = null;
var MAX_ERROR_FIELD_LENGTH = 120;
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
    _pixelSender.send(new StateWrapper(asErrorDetails(error)).combineWith(_state || {}).combineWith(enrich()));
  }
}

function register(state) {
  try {

    if (window && window[EVENT_BUS_NAMESPACE] && isFunction(window[EVENT_BUS_NAMESPACE].on)) {
      window[EVENT_BUS_NAMESPACE].on(ERRORS_PREFIX, _pixelError);
    }

    _pixelSender = new PixelSender(state, null);
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
  var domain = loadedDomain();
  var domainKey = domainHash(_fixupDomain(domain) + '/', 4);
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
  var duidLsKey = getLegacyIdentifierKey();

  try {
    if (state.appId && storageHandler.hasLocalStorage()) {
      var previousIdentifier = storageHandler.getDataFromLocalStorage(duidLsKey);
      var legacyId = getLegacyId(previousIdentifier);
      return {
        legacyId: legacyId
      };
    }
  } catch (e) {
    error('LegacyDuidEnrich', 'Error while getting legacy duid', e);
  }

  return {};
}

/**
 * @param url
 * @param responseHandler
 * @param fallback
 * @param timeout
 */

var get = function get(url, responseHandler) {
  var fallback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function () {};
  var timeout = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1000;

  function errorCallback(name, message, error$1, request) {
    error(name, message, error$1);
    fallback();
  }

  function xhrCall() {
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        var status = xhr.status;

        if (status >= 200 && status < 300 || status === 304) {
          responseHandler(xhr.responseText, xhr);
        } else {
          var error = new Error("Incorrect status received : ".concat(status));
          errorCallback('XHRError', "Error during XHR call: ".concat(status, ", url: ").concat(url), error);
        }
      }
    };

    return xhr;
  }

  function xdrCall() {
    var xdr = new window.XDomainRequest();

    xdr.onprogress = function () {};

    xdr.onerror = function () {
      var error = new Error("XDR Error received: ".concat(xdr.responseText));
      errorCallback('XDRError', "Error during XDR call: ".concat(xdr.responseText, ", url: ").concat(url), error);
    };

    xdr.onload = function () {
      return responseHandler(xdr.responseText, xdr);
    };

    return xdr;
  }

  try {
    var request = window && window.XDomainRequest ? xdrCall() : xhrCall();

    request.ontimeout = function () {
      var error = new Error("Timeout after ".concat(timeout, ", url : ").concat(url));
      errorCallback('AjaxTimeout', "Timeout after ".concat(timeout), error, request);
    };

    request.open('GET', url, true);
    request.timeout = timeout;
    request.withCredentials = true;
    request.send();
  } catch (error) {
    errorCallback('AjaxCompositionError', "Error while constructing ajax request, ".concat(error), error);
  }
};

var IDEX_STORAGE_KEY = '__li_idex_cache';
var DEFAULT_IDEX_URL = 'https://idx.liadm.com/idex';
var DEFAULT_EXPIRATION_DAYS$1 = 1;
var DEFAULT_AJAX_TIMEOUT = 1000;

function _responseReceived(storageHandler, domain, expirationDays, successCallback) {
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
      storageHandler.setCookie(IDEX_STORAGE_KEY, JSON.stringify(responseObj), expiresInDays(expirationDays), 'Lax', domain);
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
/**
 * @param {State} config
 * @param {StorageHandler} storageHandler
 * @return {{resolve: function(callback: function, additionalParams: Object), getUrl: function(additionalParams: Object)}}
 * @constructor
 */


function IdentityResolver(config, storageHandler) {
  var encodedOrNull = function encodedOrNull(value) {
    return value && encodeURIComponent(value);
  };

  var fallback = function fallback(successCallback) {
    if (isFunction(successCallback)) {
      successCallback({}, undefined);
    }
  };

  try {
    var nonNullConfig = config || {};
    var idexConfig = nonNullConfig.identityResolutionConfig || {};
    var externalIds = nonNullConfig.retrievedIdentifiers || [];
    var expirationDays = idexConfig.expirationDays || DEFAULT_EXPIRATION_DAYS$1;
    var source = idexConfig.source || 'unknown';
    var publisherId = idexConfig.publisherId || 'any';
    var url = idexConfig.url || DEFAULT_IDEX_URL;
    var timeout = idexConfig.ajaxTimeout || DEFAULT_AJAX_TIMEOUT;
    var tuples = [];
    tuples.push(['duid', encodedOrNull(nonNullConfig.peopleVerifiedId)]);
    tuples.push(['us_privacy', encodedOrNull(nonNullConfig.usPrivacyString)]);
    externalIds.forEach(function (retrievedIdentifier) {
      var key = encodedOrNull(retrievedIdentifier.name);
      var value = encodedOrNull(retrievedIdentifier.value);
      tuples.push([key, value]);
    });

    var composeUrl = function composeUrl(additionalParams) {
      var originalParams = tuples.slice().concat(_additionalParams(additionalParams));
      var params = toParams(originalParams);
      return "".concat(url, "/").concat(source, "/").concat(publisherId).concat(params);
    };

    var unsafeResolve = function unsafeResolve(successCallback, additionalParams) {
      var finalUrl = composeUrl(additionalParams);
      var storedCookie = storageHandler.getCookie(IDEX_STORAGE_KEY);

      if (storedCookie) {
        successCallback(JSON.parse(storedCookie));
      } else {
        get(finalUrl, _responseReceived(storageHandler, nonNullConfig.domain, expirationDays, successCallback), function () {
          return fallback(successCallback);
        }, timeout);
      }
    };

    return {
      resolve: function resolve(callback, additionalParams) {
        try {
          unsafeResolve(callback, additionalParams);
        } catch (e) {
          fallback(callback);
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
      resolve: function resolve(successCallback) {
        fallback(successCallback);
        error('IdentityResolver.resolve', 'Resolve called on an uninitialised IdentityResolver', e);
      },
      getUrl: function getUrl() {
        error('IdentityResolver.getUrl', 'getUrl called on an uninitialised IdentityResolver', e);
      }
    };
  }
}

var browserCookies = createCommonjsModule(function (module, exports) {
  exports.defaults = {};

  exports.set = function (name, value, options) {
    // Retrieve options and defaults
    var opts = options || {};
    var defaults = exports.defaults; // Apply default value for unspecified options

    var expires = opts.expires || defaults.expires;
    var domain = opts.domain || defaults.domain;
    var path = opts.path !== undefined ? opts.path : defaults.path !== undefined ? defaults.path : '/';
    var secure = opts.secure !== undefined ? opts.secure : defaults.secure;
    var httponly = opts.httponly !== undefined ? opts.httponly : defaults.httponly;
    var samesite = opts.samesite !== undefined ? opts.samesite : defaults.samesite; // Determine cookie expiration date
    // If succesful the result will be a valid Date, otherwise it will be an invalid Date or false(ish)

    var expDate = expires ? new Date( // in case expires is an integer, it should specify the number of days till the cookie expires
    typeof expires === 'number' ? new Date().getTime() + expires * 864e5 : // else expires should be either a Date object or in a format recognized by Date.parse()
    expires) : 0; // Set cookie

    document.cookie = name.replace(/[^+#$&^`|]/g, encodeURIComponent) // Encode cookie name
    .replace('(', '%28').replace(')', '%29') + '=' + value.replace(/[^+#$&/:<-\[\]-}]/g, encodeURIComponent) + ( // Encode cookie value (RFC6265)
    expDate && expDate.getTime() >= 0 ? ';expires=' + expDate.toUTCString() : '') + ( // Add expiration date
    domain ? ';domain=' + domain : '') + ( // Add domain
    path ? ';path=' + path : '') + ( // Add path
    secure ? ';secure' : '') + ( // Add secure option
    httponly ? ';httponly' : '') + ( // Add httponly option
    samesite ? ';samesite=' + samesite : ''); // Add samesite option
  };

  exports.get = function (name) {
    var cookies = document.cookie.split(';'); // Iterate all cookies

    while (cookies.length) {
      var cookie = cookies.pop(); // Determine separator index ("name=value")

      var separatorIndex = cookie.indexOf('='); // IE<11 emits the equal sign when the cookie value is empty

      separatorIndex = separatorIndex < 0 ? cookie.length : separatorIndex;
      var cookie_name = decodeURIComponent(cookie.slice(0, separatorIndex).replace(/^\s+/, '')); // Return cookie value if the name matches

      if (cookie_name === name) {
        return decodeURIComponent(cookie.slice(separatorIndex + 1));
      }
    } // Return `null` as the cookie was not found


    return null;
  };

  exports.erase = function (name, options) {
    exports.set(name, '', {
      expires: -1,
      domain: options && options.domain,
      path: options && options.path,
      secure: 0,
      httponly: 0
    });
  };

  exports.all = function () {
    var all = {};
    var cookies = document.cookie.split(';'); // Iterate all cookies

    while (cookies.length) {
      var cookie = cookies.pop(); // Determine separator index ("name=value")

      var separatorIndex = cookie.indexOf('='); // IE<11 emits the equal sign when the cookie value is empty

      separatorIndex = separatorIndex < 0 ? cookie.length : separatorIndex; // add the cookie name and value to the `all` object

      var cookie_name = decodeURIComponent(cookie.slice(0, separatorIndex).replace(/^\s+/, ''));
      all[cookie_name] = decodeURIComponent(cookie.slice(separatorIndex + 1));
    }

    return all;
  };
});
var browserCookies_1 = browserCookies.defaults;
var browserCookies_2 = browserCookies.set;
var browserCookies_3 = browserCookies.get;
var browserCookies_4 = browserCookies.erase;
var browserCookies_5 = browserCookies.all;

/**
 * @typedef {Object} StorageOptions
 * @property {(number| Date |undefined)} [expires]
 * @property {(string|undefined)} [domain]
 * @property {(string|undefined)} [path]
 * @property {(boolean|undefined)} [secure]
 * @property {(boolean|undefined)} [httponly]
 * @property {((''|'Strict'|'Lax')|undefined)} [samesite]
 */
var _hasLocalStorage = null;
/**
 * @returns {boolean}
 * @private
 */

function hasLocalStorage() {
  if (_hasLocalStorage == null) {
    _hasLocalStorage = _checkLocalStorage();
  }

  return _hasLocalStorage;
}
/**
 * @returns {boolean}
 * @private
 */

function _checkLocalStorage() {
  var enabled = false;

  try {
    if (window && window.localStorage) {
      var key = Math.random().toString();
      window.localStorage.setItem(key, key);
      enabled = window.localStorage.getItem(key) === key;
      window.localStorage.removeItem(key);
    }
  } catch (e) {
    error('LSCheckError', e.message, e);
  }

  return enabled;
}
/**
 * @param {string} key
 * @returns {string|null}
 */


function getCookie(key) {
  return browserCookies_3(key);
}
/**
 * @param key
 * @return {string|null}
 * @private
 */

function _unsafeGetFromLs(key) {
  return window.localStorage.getItem(key);
}
/**
 * @param {string} key
 * @returns {string|null}
 */


function getDataFromLocalStorage(key) {
  var ret = null;

  if (hasLocalStorage()) {
    ret = _unsafeGetFromLs(key);
  }

  return ret;
}
/**
 * @param keyLike
 * @return {[String]}
 */

function findSimilarCookies(keyLike) {
  var ret = [];

  try {
    var allCookies = browserCookies_5();

    for (var cookieName in allCookies) {
      if (allCookies[cookieName] && cookieName.indexOf(keyLike) >= 0) {
        ret.push(browserCookies_3(cookieName));
      }
    }
  } catch (e) {
    error('CookieFindSimilarInJar', 'Failed fetching from a cookie jar', e);
  }

  return ret;
}
/**
 * @param {string} key
 * @param {string} value
 * @param {number} expires
 * @param {string} sameSite
 * @param {string} domain
 * @returns void
 */

function setCookie(key, value, expires, sameSite, domain) {
  browserCookies_2(key, value, {
    domain: domain,
    expires: expires,
    samesite: sameSite
  });
}
/**
 * @param {string} key
 * @returns {string|null}
 */

function removeDataFromLocalStorage(key) {
  if (hasLocalStorage()) {
    window.localStorage.removeItem(key);
  }
}
/**
 * @param {string} key
 * @param {string} value
 * @returns {string|null}
 */

function setDataInLocalStorage(key, value) {
  if (hasLocalStorage()) {
    window.localStorage.setItem(key, value);
  }
}

var lcStorage = /*#__PURE__*/Object.freeze({
  __proto__: null,
  hasLocalStorage: hasLocalStorage,
  getCookie: getCookie,
  getDataFromLocalStorage: getDataFromLocalStorage,
  findSimilarCookies: findSimilarCookies,
  setCookie: setCookie,
  removeDataFromLocalStorage: removeDataFromLocalStorage,
  setDataInLocalStorage: setDataInLocalStorage
});

/**
 * @typedef {Object} StorageHandler
 * @property {function} [hasLocalStorage]
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
  function _externalOrDefault(functionName) {
    var hasExternal = externalStorageHandler && externalStorageHandler[functionName] && isFunction(externalStorageHandler[functionName]);

    if (hasExternal) {
      return externalStorageHandler[functionName];
    } else {
      return lcStorage[functionName] || _noOp;
    }
  }

  var _orElseNoOp = function _orElseNoOp(fName) {
    return strEqualsIgnoreCase(storageStrategy, StorageStrategy.none) ? _noOp : _externalOrDefault(fName);
  };

  return {
    hasLocalStorage: _orElseNoOp('hasLocalStorage'),
    getCookie: _externalOrDefault('getCookie'),
    setCookie: _orElseNoOp('setCookie'),
    getDataFromLocalStorage: _externalOrDefault('getDataFromLocalStorage'),
    removeDataFromLocalStorage: _orElseNoOp('removeDataFromLocalStorage'),
    setDataInLocalStorage: _orElseNoOp('setDataInLocalStorage'),
    findSimilarCookies: _externalOrDefault('findSimilarCookies')
  };
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

    pixelClient.send(enrichedState.combineWith(withHemStore));
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
      var event = arg;

      if (isArray(event)) {
        event.forEach(function (e) {
          return _pushSingleEvent(e, pixelClient, enrichedState);
        });
      } else {
        _pushSingleEvent(event, pixelClient, enrichedState);
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
        var error$1 = new Error();
        error$1.name = 'ConfigSent';
        error$1.message = 'Additional configuration received';
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
 * @returns {LiveConnect}
 * @private
 */


function _standardInitialization(liveConnectConfig, externalStorageHandler) {
  try {
    init();
    register(liveConnectConfig);
  } catch (e) {
  }

  try {
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

    var pixelClient = new PixelSender(liveConnectConfig, onPixelLoad, onPixelPreload);
    var resolver = IdentityResolver(postManagedState.data, storageHandler);

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
 * @returns {LiveConnect}
 * @constructor
 */


function LiveConnect(liveConnectConfig, externalStorageHandler) {

  try {
    var queue = window.liQ || [];
    var configuration = isObject(liveConnectConfig) && liveConnectConfig || {};
    window && (window.liQ = _getInitializedLiveConnect(configuration) || _standardInitialization(configuration, externalStorageHandler) || queue);

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
