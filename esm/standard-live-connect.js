function E (replaySize) {
  this.size = parseInt(replaySize) || 5;
  this.h = {};
  this.q = {};
}
E.prototype = {
  on: function (name, callback, ctx) {
    (this.h[name] || (this.h[name] = [])).push({
      fn: callback,
      ctx: ctx
    });
    const eventQueueLen = (this.q[name] || []).length;
    for (let i = 0; i < eventQueueLen; i++) {
      callback.apply(ctx, this.q[name][i]);
    }
    return this
  },
  once: function (name, callback, ctx) {
    const self = this;
    const eventQueue = this.q[name] || [];
    if (eventQueue.length > 0) {
      callback.apply(ctx, eventQueue[0]);
      return this
    } else {
      const listener = function () {
        self.off(name, listener);
        callback.apply(ctx, arguments);
      };
      listener._ = callback;
      return this.on(name, listener, ctx)
    }
  },
  emit: function (name) {
    const data = [].slice.call(arguments, 1);
    const evtArr = (this.h[name] || []).slice();
    let i = 0;
    const len = evtArr.length;
    for (i; i < len; i++) {
      evtArr[i].fn.apply(evtArr[i].ctx, data);
    }
    const eventQueue = this.q[name] || (this.q[name] = []);
    if (eventQueue.length >= this.size) {
      eventQueue.shift();
    }
    eventQueue.push(data);
    return this
  },
  off: function (name, callback) {
    const handlers = this.h[name];
    const liveEvents = [];
    if (handlers && callback) {
      for (let i = 0, len = handlers.length; i < len; i++) {
        if (handlers[i].fn !== callback && handlers[i].fn._ !== callback) {
          liveEvents.push(handlers[i]);
        }
      }
    }
    (liveEvents.length)
      ? this.h[name] = liveEvents
      : delete this.h[name];
    return this
  }
};

const EVENT_BUS_NAMESPACE = '__li__evt_bus';
const ERRORS_PREFIX = 'li_errors';
const PIXEL_SENT_PREFIX = 'lips';
const PRELOAD_PIXEL = 'pre_lips';
const PEOPLE_VERIFIED_LS_ENTRY = '_li_duid';
const DEFAULT_IDEX_EXPIRATION_HOURS = 1;
const DEFAULT_IDEX_AJAX_TIMEOUT = 5000;
const DEFAULT_IDEX_URL = 'https://idx.liadm.com/idex';

function init (size, errorCallback) {
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
    return window[EVENT_BUS_NAMESPACE]
  } catch (e) {
    errorCallback(e);
  }
}

function _emit (prefix, message) {
  window && window[EVENT_BUS_NAMESPACE] && window[EVENT_BUS_NAMESPACE].emit(prefix, message);
}
function send (prefix, message) {
  _emit(prefix, message);
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

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const uuidRegex = new RegExp(`^${UUID}$`, 'i');
function safeToString (value) {
  return typeof value === 'object' ? JSON.stringify(value) : ('' + value)
}
function isNonEmpty (value) {
  return typeof value !== 'undefined' && value !== null && trim(value).length > 0
}
function isUUID (value) {
  return value && uuidRegex.test(trim(value))
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
function expiresInDays (expires) {
  return expiresIn(expires, 864e5).toUTCString()
}
function expiresIn (expires, number) {
  return new Date((new Date().getTime() + (expires * number)))
}
function expiresInHours (expires) {
  return expiresIn(expires, 36e5).toUTCString()
}
function asParamOrEmpty (param, value, transform) {
  return isNonEmpty(value) ? ([param, isFunction(transform) ? transform(value) : value]) : []
}
function asStringParam (param, value) {
  return asParamOrEmpty(param, value, (s) => encodeURIComponent(s))
}
function mapAsParams (paramsMap) {
  if (paramsMap && isObject(paramsMap)) {
    const array = [];
    Object.keys(paramsMap).forEach((key) => {
      const value = paramsMap[key];
      value && !isObject(value) && value.length && array.push([encodeURIComponent(key), encodeURIComponent(value)]);
    });
    return array
  } else {
    return []
  }
}
function merge (obj1, obj2) {
  const res = {};
  const clean = (obj) => isObject(obj) ? obj : {};
  const first = clean(obj1);
  const second = clean(obj2);
  Object.keys(first).forEach(function (key) {
    res[key] = first[key];
  });
  Object.keys(second).forEach(function (key) {
    res[key] = second[key];
  });
  return res
}

const DEFAULT_AJAX_TIMEOUT = 0;
function PixelSender (liveConnectConfig, calls, onload, presend) {
  const url = (liveConnectConfig && liveConnectConfig.collectorUrl) || 'https://rp.liadm.com';
  function _sendAjax (state) {
    _sendState(state, 'j', uri => {
      calls.ajaxGet(
        uri,
        bakersJson => {
          if (isFunction(onload)) onload();
          _callBakers(bakersJson);
        },
        (e) => {
          _sendPixel(state);
          error('AjaxFailed', e.message, e);
        },
        DEFAULT_AJAX_TIMEOUT
      );
    });
  }
  function _callBakers (bakersJson) {
    try {
      const bakers = JSON.parse(bakersJson).bakers;
      if (isArray(bakers)) {
        for (let i = 0; i < bakers.length; i++) calls.pixelGet(`${bakers[i]}?dtstmp=${utcMillis()}`);
      }
    } catch (e) {
      error('CallBakers', 'Error while calling bakers', e);
    }
  }
  function _sendPixel (state) {
    _sendState(state, 'p', uri => calls.pixelGet(uri, onload));
  }
  function _sendState (state, endpoint, makeCall) {
    if (state.sendsPixel()) {
      if (isFunction(presend)) {
        presend();
      }
      const latest = `dtstmp=${utcMillis()}`;
      const queryString = state.asQueryString();
      const withDt = queryString ? `&${latest}` : `?${latest}`;
      const uri = `${url}/${endpoint}${queryString}${withDt}`;
      makeCall(uri);
    }
  }
  function utcMillis () {
    const now = new Date();
    return new Date(now.toUTCString()).getTime() + now.getMilliseconds()
  }
  return {
    sendAjax: _sendAjax,
    sendPixel: _sendPixel
  }
}

function btoa (s) {
  let i;
  s = `${s}`;
  for (i = 0; i < s.length; i++) {
    if (s.charCodeAt(i) > 255) {
      return null
    }
  }
  let out = '';
  for (i = 0; i < s.length; i += 3) {
    const groupsOfSix = [undefined, undefined, undefined, undefined];
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
    for (let j = 0; j < groupsOfSix.length; j++) {
      if (typeof groupsOfSix[j] === 'undefined') {
        out += '=';
      } else {
        out += btoaLookup(groupsOfSix[j]);
      }
    }
  }
  return out
}
const keystr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function btoaLookup (index) {
  return (index >= 0 && index < 64) ? keystr[index] : undefined
}

function _safeBtoa (s) {
  const res = btoa(s);
  return res || ''
}
const _base64encodeRegex = /[+/]|=+$/g;
const _base64ToUrlEncodedChars = {
  '+': '-',
  '/': '_'
};
function _replaceBase64Chars (x) {
  return _base64ToUrlEncodedChars[x] || ''
}
function base64UrlEncode (s) {
  let btoa = null;
  const utf8Bytes = encodeURIComponent(s).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1));
  try {
    btoa = (window && isFunction(window.btoa)) ? window.btoa : _safeBtoa;
  } catch (e) {
    btoa = _safeBtoa;
  }
  return btoa(utf8Bytes).replace(_base64encodeRegex, _replaceBase64Chars)
}

const emailRegex = () => /\S+(@|%40)\S+\.\S+/;
function isEmail (s) {
  return emailRegex().test(s)
}
const emailLikeRegex = /"([^"]+(@|%40)[^"]+[.][a-z]*(\s+)?)(\\"|")/;
function containsEmailField (s) {
  return emailLikeRegex.test(s)
}
function extractEmail (s) {
  const result = s.match(emailRegex());
  return result && result.map(trim)[0]
}
function listEmailsInString (s) {
  const result = [];
  const multipleEmailLikeRegex = new RegExp(emailLikeRegex.source, 'g');
  let current = multipleEmailLikeRegex.exec(s);
  while (current) {
    result.push(trim(current[1]));
    current = multipleEmailLikeRegex.exec(s);
  }
  return result
}

const MASK = '*********';
function replacer (key, value) {
  return (typeof value === 'string' && isEmail(trim(value))) ? MASK : value
}

for(var r=[],o=0;o<64;)r[o]=0|4294967296*Math.sin(++o%Math.PI);function md5(t){var e,f,n,a=[e=1732584193,f=4023233417,~e,~f],c=[],h=unescape(encodeURI(t))+"",u=h.length;for(t=--u/4+2|15,c[--t]=8*u;~u;)c[u>>2]|=h.charCodeAt(u)<<8*u--;for(o=h=0;o<t;o+=16){for(u=a;h<64;u=[n=u[3],e+((n=u[0]+[e&f|~e&n,n&e|~n&f,e^f^n,f^(e|~n)][u=h>>4]+r[h]+~~c[o|15&[h,5*h+1,3*h+5,7*h][u]])<<(u=[7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21][4*u+h++%4])|n>>>-u),e,f])e=0|u[1],f=u[2];for(h=4;h;)a[--h]+=u[h];}for(t="";h<32;)t+=(a[h>>3]>>4*(1^h++)&15).toString(16);return t}

function sha1(r){var o,e,t,f,n,a=[],c=[e=1732584193,t=4023233417,~e,~t,3285377520],u=[],d=unescape(encodeURI(r))+"",g=d.length;for(u[r=--g/4+2|15]=8*g;~g;)u[g>>2]|=d.charCodeAt(g)<<8*~g--;for(o=g=0;o<r;o+=16){for(e=c;g<80;e=[e[4]+(a[g]=g<16?~~u[o+g]:2*d|d<0)+1518500249+[t&f|~t&n,d=341275144+(t^f^n),882459459+(t&f|t&n|f&n),d+1535694389][g++/5>>2]+((d=e[0])<<5|d>>>27),d,t<<30|t>>>2,f,n])d=a[g-3]^a[g-8]^a[g-14]^a[g-16],t=e[1],f=e[2],n=e[3];for(g=5;g;)c[--g]+=e[g];}for(d="";g<40;)d+=(c[g>>3]>>4*(7-g++)&15).toString(16);return d}

for(var r$1,o$1=18,n=[],t=[];o$1>1;o$1--)for(r$1=o$1;r$1<320;)n[r$1+=o$1]=1;function e(r,o){return 4294967296*Math.pow(r,1/o)|0}for(r$1=0;r$1<64;)n[++o$1]||(t[r$1]=e(o$1,2),n[r$1++]=e(o$1,3));function f(r,o){return r>>>o|r<<-o}function sha256(u){var c=t.slice(o$1=r$1=0,8),i=[],a=unescape(encodeURI(u))+"",p=a.length;for(i[u=--p/4+2|15]=8*p;~p;)i[p>>2]|=a.charCodeAt(p)<<8*~p--;for(p=[];o$1<u;o$1+=16){for(e=c.slice();r$1<64;e.unshift(a+(f(a=e[0],2)^f(a,13)^f(a,22))+(a&e[1]^e[1]&e[2]^e[2]&a)))e[3]+=a=0|(p[r$1]=r$1<16?~~i[r$1+o$1]:(f(a=p[r$1-2],17)^f(a,19)^a>>>10)+p[r$1-7]+(f(a=p[r$1-15],7)^f(a,18)^a>>>3)+p[r$1-16])+e.pop()+(f(a=e[4],6)^f(a,11)^f(a,25))+(a&e[5]^~a&e[6])+n[r$1++];for(r$1=8;r$1;)c[--r$1]+=e[r$1];}for(a="";r$1<64;)a+=(c[r$1>>3]>>4*(7-r$1++)&15).toString(16);return a}

const hashLikeRegex = () => /(\s+)?[a-f0-9]{32,64}(\s+)?/gi;
const lengthToHashType = {
  32: 'md5',
  40: 'sha1',
  64: 'sha256'
};
function isHash (hash) {
  const extractedHash = extractHashValue(hash);
  return !!extractedHash && lengthToHashType[extractedHash.length] != null
}
function extractHashValue (s) {
  const result = s.match(hashLikeRegex());
  return result && result.map(trim)[0]
}
function hashEmail (email) {
  const lowerCasedEmail = email.toLowerCase();
  return {
    md5: md5(lowerCasedEmail),
    sha1: sha1(lowerCasedEmail),
    sha256: sha256(lowerCasedEmail)
  }
}
function domainHash (domain, limit = 12) {
  return sha1(domain.replace(/^\./, '')).substring(0, limit)
}

const MAX_ITEMS = 10;
const LIMITING_KEYS = ['items', 'itemids'];
const HASH_BEARERS = ['email', 'emailhash', 'hash', 'hashedemail'];
function _provided (state) {
  const eventSource = state.eventSource;
  const objectKeys = Object.keys(eventSource);
  for (const key of objectKeys) {
    const lowerCased = key.toLowerCase();
    if (HASH_BEARERS.indexOf(lowerCased) > -1) {
      const value = trim(safeToString(eventSource[key]));
      const extractedEmail = extractEmail(value);
      const extractedHash = extractHashValue(value);
      if (extractedEmail) {
        const hashes = hashEmail(decodeURIComponent(extractedEmail));
        return merge({ hashedEmail: [hashes.md5, hashes.sha1, hashes.sha256] }, state)
      } else if (extractedHash && isHash(extractedHash)) {
        return merge({ hashedEmail: [extractedHash.toLowerCase()] }, state)
      }
    }
  }
  return state
}
function _itemsLimiter (state) {
  const event = state.eventSource;
  Object.keys(event).forEach(key => {
    const lowerCased = key.toLowerCase();
    if (LIMITING_KEYS.indexOf(lowerCased) > -1 && isArray(event[key]) && event[key].length > MAX_ITEMS) {
      event[key].length = MAX_ITEMS;
    }
  });
  return {}
}
const fiddlers = [_provided, _itemsLimiter];
function fiddle (state) {
  const reducer = (accumulator, func) => {
    return merge(accumulator, func(accumulator))
  };
  if (isObject(state.eventSource)) {
    return fiddlers.reduce(reducer, state)
  } else {
    return state
  }
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
function _decode (s) {
  return s.indexOf('%') === -1 ? s : decodeURIComponent(s)
}
function _isNum (v) {
  return isNaN(+v) ? v : +v
}
function _isNull (v) {
  return v === 'null' || v === 'undefined' ? null : v
}
function _isBoolean (v) {
  return v === 'false' ? false : (v === 'true' ? true : v)
}
function _convert (v) {
  return _isBoolean(_isNull(_isNum(v)))
}
function urlParams (url) {
  let questionMarkIndex, queryParams, historyIndex;
  const obj = {};
  if (!url || (questionMarkIndex = url.indexOf('?')) === -1 || !(queryParams = url.slice(questionMarkIndex + 1))) {
    return obj
  }
  if ((historyIndex = queryParams.indexOf('#')) !== -1 && !(queryParams = queryParams.slice(0, historyIndex))) {
    return obj
  }
  queryParams.split('&').forEach(function (query) {
    if (query) {
      query = ((query = query.split('=')) && query.length === 2 ? query : [query[0], 'true']).map(_decode);
      if (query[0].slice(-2) === '[]') obj[query[0] = query[0].slice(0, -2)] = obj[query[0]] || [];
      if (!obj[query[0]]) return (obj[query[0]] = _convert(query[1]))
      isArray(obj[query[0]]) ? obj[query[0]].push(_convert(query[1])) : (obj[query[0]] = [obj[query[0]], _convert(query[1])]);
    }
  });
  return obj
}

const noOpEvents = ['setemail', 'setemailhash', 'sethashedemail'];
const _pMap = {
  appId: aid => {
    return asStringParam('aid', aid)
  },
  eventSource: source => {
    return asParamOrEmpty('se', source, (s) => base64UrlEncode(JSON.stringify(s, replacer)))
  },
  liveConnectId: fpc => {
    return asStringParam('duid', fpc)
  },
  legacyId: legacyFpc => {
    return asStringParam('lduid', legacyFpc && legacyFpc.duid)
  },
  trackerName: tn => {
    return asStringParam('tna', tn || 'unknown')
  },
  pageUrl: purl => {
    return asStringParam('pu', purl)
  },
  errorDetails: ed => {
    return asParamOrEmpty('ae', ed, (s) => base64UrlEncode(JSON.stringify(s)))
  },
  retrievedIdentifiers: identifiers => {
    const identifierParams = [];
    identifiers.forEach((i) => identifierParams.push(asStringParam(`ext_${i.name}`, i.value)));
    return identifierParams
  },
  hashesFromIdentifiers: hashes => {
    const hashParams = [];
    hashes.forEach((h) => hashParams.push(asParamOrEmpty('scre', `${h.md5},${h.sha1},${h.sha256}`)));
    return hashParams
  },
  decisionIds: dids => {
    return asStringParam('li_did', dids.join(','))
  },
  hashedEmail: he => {
    return asStringParam('e', he.join(','))
  },
  usPrivacyString: usps => {
    return asStringParam('us_privacy', usps && encodeURIComponent(usps))
  },
  wrapperName: wrapper => {
    return asStringParam('wpn', wrapper && encodeURIComponent(wrapper))
  },
  gdprApplies: gdprApplies => {
    return asParamOrEmpty('gdpr', gdprApplies, (s) => encodeURIComponent(s ? 1 : 0))
  },
  gdprConsent: gdprConsentString => {
    return asStringParam('gdpr_consent', gdprConsentString && encodeURIComponent(gdprConsentString))
  },
  referrer: referrer => {
    return asStringParam('refr', referrer)
  }
};
function StateWrapper (state) {
  let _state = {};
  if (state) {
    _state = _safeFiddle(state);
  }
  function _sendsPixel () {
    const source = isObject(_state.eventSource) ? _state.eventSource : {};
    const eventKeys = Object.keys(source)
      .filter(objKey => objKey.toLowerCase() === 'eventname' || objKey.toLowerCase() === 'event');
    const eventKey = eventKeys && eventKeys.length >= 1 && eventKeys[0];
    const eventName = eventKey && trim(_state.eventSource[eventKey]);
    return !eventName || noOpEvents.indexOf(eventName.toLowerCase()) === -1
  }
  function _safeFiddle (newInfo) {
    try {
      return fiddle(JSON.parse(JSON.stringify(newInfo)))
    } catch (e) {
      error('StateCombineWith', 'Error while extracting event data', e);
      return _state
    }
  }
  function _combineWith (newInfo) {
    return new StateWrapper(merge(state, newInfo))
  }
  function _asTuples () {
    let array = [];
    Object.keys(_state).forEach((key) => {
      const value = _state[key];
      if (_pMap[key]) {
        const params = _pMap[key](value);
        if (params && params.length) {
          if (params[0] instanceof Array) {
            array = array.concat(params);
          } else {
            array.push(params);
          }
        }
      }
    });
    return array
  }
  function _asQueryString () {
    return toParams(_asTuples())
  }
  return {
    data: _state,
    combineWith: _combineWith,
    asQueryString: _asQueryString,
    asTuples: _asTuples,
    sendsPixel: _sendsPixel
  }
}

function loadedDomain () {
  return (document.domain || (document.location && document.location.host)) || (window && window.location && window.location.host) || 'localhost'
}
function getReferrer (win = window) {
  return _safeGet(() => win.top.document.referrer)
}
function getPage (win = window) {
  const ancestorOrigins = _safeGet(() => win.location.ancestorOrigins) || {};
  const windows = [];
  let currentWindow = win;
  while (currentWindow !== top) {
    windows.push(currentWindow);
    currentWindow = currentWindow.parent;
  }
  windows.push(currentWindow);
  let detectedPageUrl;
  for (let i = windows.length - 1; i >= 0 && !detectedPageUrl; i--) {
    detectedPageUrl = _safeGet(() => windows[i].location.href);
    if (i !== 0) {
      if (!detectedPageUrl) detectedPageUrl = _safeGet(() => windows[i - 1].document.referrer);
      if (!detectedPageUrl) detectedPageUrl = ancestorOrigins[i - 1];
    }
  }
  return detectedPageUrl
}
function _safeGet (getter) {
  try {
    return getter()
  } catch (e) {
    return undefined
  }
}

let _currentPage = null;
function enrich (state) {
  if (!_currentPage) {
    _currentPage = {
      pageUrl: getPage(),
      referrer: getReferrer()
    };
  }
  return _currentPage
}

let _state = null;
let _pixelSender = null;
const MAX_ERROR_FIELD_LENGTH = 120;
const _defaultReturn = {
  errorDetails: {
    message: 'Unknown message',
    name: 'Unknown name'
  }
};
function _asInt (field) {
  try {
    const intValue = field * 1;
    return isNaN(intValue) ? undefined : intValue
  } catch {
  }
}
function _truncate (value) {
  try {
    if (value && value.length && value.length > MAX_ERROR_FIELD_LENGTH) {
      return `${value.substr(0, MAX_ERROR_FIELD_LENGTH)}...`
    } else {
      return value
    }
  } catch {
  }
}
function asErrorDetails (e) {
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
    }
  } else {
    return _defaultReturn
  }
}
function _pixelError (error) {
  if (_pixelSender) {
    _pixelSender.sendPixel(new StateWrapper(asErrorDetails(error)).combineWith(_state || {}).combineWith(enrich()));
  }
}
function register (state, callHandler) {
  try {
    if (window && window[EVENT_BUS_NAMESPACE] && isFunction(window[EVENT_BUS_NAMESPACE].on)) {
      window[EVENT_BUS_NAMESPACE].on(ERRORS_PREFIX, _pixelError);
    }
    _pixelSender = new PixelSender(state, callHandler);
    _state = state || {};
  } catch (e) {
  }
}

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ENCODING_LEN = ENCODING.length;
const TIME_MAX = Math.pow(2, 48) - 1;
const TIME_LEN = 10;
const RANDOM_LEN = 16;
const prng = detectPrng();
function createError (message) {
  const err = new Error(message);
  err.source = 'Ulid';
  return err
}
function detectPrng () {
  const root = typeof window !== 'undefined' ? window : null;
  const browserCrypto = root && (root.crypto || root.msCrypto);
  if (browserCrypto) {
    return () => {
      const buffer = new Uint8Array(1);
      browserCrypto.getRandomValues(buffer);
      return buffer[0] / 0xff
    }
  }
  return () => Math.random()
}
function encodeTime (now, len) {
  if (now > TIME_MAX) {
    throw createError('cannot encode time greater than ' + TIME_MAX)
  }
  let mod;
  let str = '';
  for (; len > 0; len--) {
    mod = now % ENCODING_LEN;
    str = ENCODING.charAt(mod) + str;
    now = (now - mod) / ENCODING_LEN;
  }
  return str
}
function encodeRandom (len) {
  let str = '';
  for (; len > 0; len--) {
    str = randomChar() + str;
  }
  return str
}
function randomChar () {
  let rand = Math.floor(prng() * ENCODING_LEN);
  if (rand === ENCODING_LEN) {
    rand = ENCODING_LEN - 1;
  }
  return ENCODING.charAt(rand)
}
function ulid () {
  return encodeTime(Date.now(), TIME_LEN) + encodeRandom(RANDOM_LEN)
}

const StorageStrategy = {
  cookie: 'cookie',
  localStorage: 'ls',
  none: 'none'
};

const NEXT_GEN_FP_NAME = '_lc2_fpi';
const TLD_CACHE_KEY = '_li_dcdm_c';
const DEFAULT_EXPIRATION_DAYS = 730;
function resolve (state, storageHandler) {
  try {
    const determineTld = () => {
      const cachedDomain = storageHandler.getCookie(TLD_CACHE_KEY);
      if (cachedDomain) {
        return cachedDomain
      }
      const domain = loadedDomain();
      const arr = domain.split('.');
      for (let i = arr.length; i > 0; i--) {
        const newD = `.${arr.slice(i - 1, arr.length).join('.')}`;
        storageHandler.setCookie(TLD_CACHE_KEY, newD, undefined, 'Lax', newD);
        if (storageHandler.getCookie(TLD_CACHE_KEY)) {
          return newD
        }
      }
      return `.${domain}`
    };
    const lsGetOrAdd = (key, value, storageOptions) => {
      let ret = null;
      try {
        if (storageHandler.localStorageIsEnabled()) {
          const expirationKey = `${key}_exp`;
          const oldLsExpirationEntry = storageHandler.getDataFromLocalStorage(expirationKey);
          const expiry = expiresIn(storageOptions.expires, 864e5);
          if (oldLsExpirationEntry && parseInt(oldLsExpirationEntry) <= new Date().getTime()) {
            storageHandler.removeDataFromLocalStorage(key);
          }
          const oldLsEntry = storageHandler.getDataFromLocalStorage(key);
          if (!oldLsEntry) {
            storageHandler.setDataInLocalStorage(key, value);
          }
          storageHandler.setDataInLocalStorage(expirationKey, `${expiry}`);
          ret = storageHandler.getDataFromLocalStorage(key);
        }
      } catch (e) {
        error('LSGetOrAdd', 'Error manipulating LS', e);
      }
      return ret
    };
    const cookieGetOrAdd = (key, value, storageOptions) => {
      let ret = null;
      try {
        const oldCookie = storageHandler.getCookie(key);
        if (oldCookie) {
          storageHandler.setCookie(key, oldCookie, expiresInDays(storageOptions.expires), 'Lax', storageOptions.domain);
        } else {
          storageHandler.setCookie(key, value, expiresInDays(storageOptions.expires), 'Lax', storageOptions.domain);
        }
        ret = storageHandler.getCookie(key);
      } catch (e) {
        error('CookieGetOrAdd', 'Failed manipulating cookie jar', e);
      }
      return ret
    };
    const getOrAddWithExpiration = (key, value, storageOptions, storageStrategy) => {
      if (strEqualsIgnoreCase(storageStrategy, StorageStrategy.localStorage)) {
        return lsGetOrAdd(key, value, storageOptions)
      } else if (strEqualsIgnoreCase(storageStrategy, StorageStrategy.none)) {
        return null
      } else {
        return cookieGetOrAdd(key, value, storageOptions)
      }
    };
    const generateCookie = (apexDomain) => {
      const cookie = `${domainHash(apexDomain)}--${ulid()}`;
      return cookie.toLocaleLowerCase()
    };
    const expiry = state.expirationDays || DEFAULT_EXPIRATION_DAYS;
    const cookieDomain = determineTld();
    const storageOptions = {
      expires: expiry,
      domain: cookieDomain
    };
    const liveConnectIdentifier = getOrAddWithExpiration(
      NEXT_GEN_FP_NAME,
      generateCookie(cookieDomain),
      storageOptions,
      state.storageStrategy);
    return {
      domain: cookieDomain,
      liveConnectId: liveConnectIdentifier
    }
  } catch (e) {
    error('IdentifiersResolve', 'Error while managing identifiers', e);
    return {}
  }
}

const DEFAULT_DECISION_ID_COOKIE_EXPIRES = expiresInDays(30);
const DECISION_ID_QUERY_PARAM_NAME = 'li_did';
const DECISION_ID_COOKIE_NAMESPACE = 'lidids.';
const _onlyUnique = (value, index, self) => self.indexOf(value) === index;
const _validUuid = (value) => isUUID(value);
const _nonEmpty = (value) => value && trim(value).length > 0;
function resolve$1 (state, storageHandler) {
  let ret = {};
  function _addDecisionId (key, cookieDomain) {
    if (key) {
      storageHandler.setCookie(
        `${DECISION_ID_COOKIE_NAMESPACE}${key}`,
        key,
        DEFAULT_DECISION_ID_COOKIE_EXPIRES,
        'Lax',
        cookieDomain);
    }
  }
  try {
    const params = (state.pageUrl && urlParams(state.pageUrl)) || {};
    const freshDecisions = [].concat(params[DECISION_ID_QUERY_PARAM_NAME] || []);
    const storedDecisions = storageHandler.findSimilarCookies(DECISION_ID_COOKIE_NAMESPACE);
    freshDecisions
      .map(trim)
      .filter(_nonEmpty)
      .filter(_validUuid)
      .filter(_onlyUnique)
      .forEach(decision => _addDecisionId(decision, state.domain));
    const allDecisions = freshDecisions
      .concat(storedDecisions)
      .map(trim)
      .filter(_nonEmpty)
      .filter(_validUuid)
      .filter(_onlyUnique);
    ret = { decisionIds: allDecisions };
  } catch (e) {
    error('DecisionsResolve', 'Error while managing decision ids', e);
  }
  return ret
}

const REPLACEMENT_THRESHOLD_MILLIS = 181 * 864e5;
function _setPeopleVerifiedStore (id, storageHandler) {
  if (id) {
    storageHandler.setDataInLocalStorage(PEOPLE_VERIFIED_LS_ENTRY, id);
  }
}
function resolve$2 (state, storageHandler) {
  try {
    const timeBefore = (new Date().getTime() - REPLACEMENT_THRESHOLD_MILLIS) / 1000;
    const legacyIdentifier = state.legacyId || {};
    const lastVisit = legacyIdentifier.currVisitTs ? parseInt(legacyIdentifier.currVisitTs) : 0;
    if (legacyIdentifier.currVisitTs && timeBefore > lastVisit && state.liveConnectId) {
      _setPeopleVerifiedStore(state.liveConnectId, storageHandler);
    }
    if (!storageHandler.getDataFromLocalStorage(PEOPLE_VERIFIED_LS_ENTRY)) {
      _setPeopleVerifiedStore(legacyIdentifier.duid || state.liveConnectId, storageHandler);
    }
    return { peopleVerifiedId: storageHandler.getDataFromLocalStorage(PEOPLE_VERIFIED_LS_ENTRY) }
  } catch (e) {
    error('PeopleVerifiedResolve', 'Error while managing people verified', e);
    return {}
  }
}

function enrich$1 (state, storageHandler) {
  try {
    return _getIdentifiers(_parseIdentifiersToResolve(state), storageHandler)
  } catch (e) {
    fromError('IdentifiersEnricher', e);
    return {}
  }
}
function _parseIdentifiersToResolve (state) {
  let cookieNames = [];
  if (state.identifiersToResolve) {
    if (isArray(state.identifiersToResolve)) {
      cookieNames = state.identifiersToResolve;
    } else if (isString(state.identifiersToResolve)) {
      cookieNames = state.identifiersToResolve.split(',');
    }
  }
  for (let i = 0; i < cookieNames.length; i++) {
    cookieNames[i] = cookieNames[i].trim();
  }
  return cookieNames
}
function _getIdentifiers (cookieNames, storageHandler) {
  const identifiers = [];
  let hashes = [];
  for (let i = 0; i < cookieNames.length; i++) {
    const identifierName = cookieNames[i];
    const identifierValue = storageHandler.getCookie(identifierName) || storageHandler.getDataFromLocalStorage(identifierName);
    if (identifierValue) {
      const cookieAndHashes = _findAndReplaceRawEmails(safeToString(identifierValue));
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
  }
}
function _findAndReplaceRawEmails (cookieValue) {
  if (containsEmailField(cookieValue)) {
    return _replaceEmailsWithHashes(cookieValue)
  } else if (isEmail(cookieValue)) {
    const hashes = hashEmail(cookieValue);
    return {
      identifierWithoutRawEmails: hashes.md5,
      hashesFromIdentifier: [hashes]
    }
  } else {
    return {
      identifierWithoutRawEmails: cookieValue,
      hashesFromIdentifier: []
    }
  }
}
function _replaceEmailsWithHashes (cookieValue) {
  const emailsInCookie = listEmailsInString(cookieValue);
  const hashes = [];
  for (let i = 0; i < emailsInCookie.length; i++) {
    const email = emailsInCookie[i];
    const emailHashes = hashEmail(email);
    cookieValue = cookieValue.replace(email, emailHashes.md5);
    hashes.push(emailHashes);
  }
  return {
    identifierWithoutRawEmails: cookieValue,
    hashesFromIdentifier: hashes
  }
}
function _deduplicateHashes (hashes) {
  const seen = {};
  const result = [];
  for (let i = 0; i < hashes.length; i++) {
    if (!(hashes[i].md5 in seen)) {
      result.push(hashes[i]);
      seen[hashes[i].md5] = true;
    }
  }
  return result
}

const APP_ID = '[a-z]-[a-z0-9]{4}';
const NUMBERS = '\\+?\\d+';
const LEGACY_COOKIE_FORMAT = `(${APP_ID}--${UUID})\\.(${NUMBERS})\\.(${NUMBERS})\\.(${NUMBERS})\\.(${NUMBERS})\\.(${UUID})`;
const LEGACY_COOKIE_REGEX = new RegExp(LEGACY_COOKIE_FORMAT, 'i');
const LEGACY_IDENTIFIER_PREFIX = '_litra_id.';
function _fixupDomain (domain) {
  let dl = domain.length;
  if (domain.charAt(--dl) === '.') {
    domain = domain.slice(0, dl);
  }
  if (domain.slice(0, 2) === '*.') {
    domain = domain.slice(1);
  }
  return domain
}
function getLegacyIdentifierKey () {
  const domain = loadedDomain();
  const domainKey = domainHash(_fixupDomain(domain) + '/', 4);
  return `${LEGACY_IDENTIFIER_PREFIX}${domainKey}`
}
function getLegacyId (entry) {
  if (entry) {
    const matches = entry.match(LEGACY_COOKIE_REGEX);
    if (matches && matches.length === 7) {
      return {
        duid: matches[1],
        creationTs: matches[2],
        sessionCount: matches[3],
        currVisitTs: matches[4],
        lastSessionVisitTs: matches[5],
        sessionId: matches[6]
      }
    }
  }
}

function enrich$2 (state, storageHandler) {
  const duidLsKey = getLegacyIdentifierKey();
  try {
    if (state.appId && storageHandler.localStorageIsEnabled()) {
      const previousIdentifier = storageHandler.getDataFromLocalStorage(duidLsKey);
      const legacyId = getLegacyId(previousIdentifier);
      return {
        legacyId: legacyId
      }
    }
  } catch (e) {
    error('LegacyDuidEnrich', 'Error while getting legacy duid', e);
  }
  return {}
}

const IDEX_STORAGE_KEY = '__li_idex_cache';
function _responseReceived (storageHandler, domain, expirationHours, successCallback) {
  return response => {
    let responseObj = {};
    if (response) {
      try {
        responseObj = JSON.parse(response);
      } catch (ex) {
        fromError('IdentityResolverParser', ex);
      }
    }
    try {
      storageHandler.setCookie(
        IDEX_STORAGE_KEY,
        JSON.stringify(responseObj),
        expiresInHours(expirationHours),
        'Lax',
        domain);
    } catch (ex) {
      fromError('IdentityResolverStorage', ex);
    }
    successCallback(responseObj);
  }
}
function IdentityResolver (config, storageHandler, calls) {
  try {
    const nonNullConfig = config || {};
    const idexConfig = nonNullConfig.identityResolutionConfig || {};
    const externalIds = nonNullConfig.retrievedIdentifiers || [];
    const expirationHours = idexConfig.expirationHours || DEFAULT_IDEX_EXPIRATION_HOURS;
    const source = idexConfig.source || 'unknown';
    const publisherId = idexConfig.publisherId || 'any';
    const url = idexConfig.url || DEFAULT_IDEX_URL;
    const timeout = idexConfig.ajaxTimeout || DEFAULT_IDEX_AJAX_TIMEOUT;
    const tuples = [];
    tuples.push(asStringParam('duid', nonNullConfig.peopleVerifiedId));
    tuples.push(asStringParam('us_privacy', nonNullConfig.usPrivacyString));
    tuples.push(asParamOrEmpty('gdpr', nonNullConfig.gdprApplies, v => encodeURIComponent(v ? 1 : 0)));
    tuples.push(asStringParam('gdpr_consent', nonNullConfig.gdprConsent));
    externalIds.forEach(retrievedIdentifier => {
      tuples.push(asStringParam(retrievedIdentifier.name, retrievedIdentifier.value));
    });
    const composeUrl = (additionalParams) => {
      const originalParams = tuples.slice().concat(mapAsParams(additionalParams));
      const params = toParams(originalParams);
      return `${url}/${source}/${publisherId}${params}`
    };
    const unsafeResolve = (successCallback, errorCallback, additionalParams) => {
      const storedCookie = storageHandler.getCookie(IDEX_STORAGE_KEY);
      if (storedCookie) {
        successCallback(JSON.parse(storedCookie));
      } else {
        calls.ajaxGet(composeUrl(additionalParams), _responseReceived(storageHandler, nonNullConfig.domain, expirationHours, successCallback), errorCallback, timeout);
      }
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
    setCookie: _orElseNoOp('setCookie'),
    getDataFromLocalStorage: _externalOrError('getDataFromLocalStorage'),
    removeDataFromLocalStorage: _orElseNoOp('removeDataFromLocalStorage'),
    setDataInLocalStorage: _orElseNoOp('setDataInLocalStorage'),
    findSimilarCookies: _externalOrError('findSimilarCookies')
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

const hemStore = {};
function _pushSingleEvent (event, pixelClient, enrichedState) {
  if (!event || !isObject(event)) {
    error('EventNotAnObject', 'Received event was not an object', new Error(event));
  } else if (event.config) {
    error('StrayConfig', 'Received a config after LC has already been initialised', new Error(event));
  } else {
    const combined = enrichedState.combineWith({ eventSource: event });
    hemStore.hashedEmail = hemStore.hashedEmail || combined.data.hashedEmail;
    const withHemStore = merge({ eventSource: event }, hemStore);
    pixelClient.sendAjax(enrichedState.combineWith(withHemStore));
  }
}
function _configMatcher (previousConfig, newConfig) {
  const equalConfigs = previousConfig.appId === newConfig.appId &&
    previousConfig.wrapperName === newConfig.wrapperName &&
    previousConfig.collectorUrl === newConfig.collectorUrl;
  if (!equalConfigs) {
    return {
      appId: [previousConfig.appId, newConfig.appId],
      wrapperName: [previousConfig.wrapperName, newConfig.wrapperName],
      collectorUrl: [previousConfig.collectorUrl, newConfig.collectorUrl]
    }
  }
}
function _processArgs (args, pixelClient, enrichedState) {
  try {
    args.forEach(arg => {
      const event = arg;
      if (isArray(event)) {
        event.forEach(e => _pushSingleEvent(e, pixelClient, enrichedState));
      } else {
        _pushSingleEvent(event, pixelClient, enrichedState);
      }
    });
  } catch (e) {
    error('LCPush', 'Failed sending an event', e);
  }
}
function _getInitializedLiveConnect (liveConnectConfig) {
  try {
    if (window && window.liQ && window.liQ.ready) {
      const mismatchedConfig = window.liQ.config && _configMatcher(window.liQ.config, liveConnectConfig);
      if (mismatchedConfig) {
        const error$1 = new Error();
        error$1.name = 'ConfigSent';
        error$1.message = 'Additional configuration received';
        error('LCDuplication', JSON.stringify(mismatchedConfig), error$1);
      }
      return window.liQ
    }
  } catch (e) {
  }
}
function _standardInitialization (liveConnectConfig, externalStorageHandler, externalCallHandler) {
  try {
    init();
    const callHandler = CallHandler(externalCallHandler);
    register(liveConnectConfig, callHandler);
    const storageHandler = StorageHandler(liveConnectConfig.storageStrategy, externalStorageHandler);
    const reducer = (accumulator, func) => accumulator.combineWith(func(accumulator.data, storageHandler));
    const enrichers = [enrich, enrich$1, enrich$2];
    const managers = [resolve, resolve$2, resolve$1];
    const enrichedState = enrichers.reduce(reducer, new StateWrapper(liveConnectConfig));
    const postManagedState = managers.reduce(reducer, enrichedState);
    const syncContainerData = merge(liveConnectConfig, { peopleVerifiedId: postManagedState.data.peopleVerifiedId });
    const onPixelLoad = () => send(PIXEL_SENT_PREFIX, syncContainerData);
    const onPixelPreload = () => send(PRELOAD_PIXEL, '0');
    const pixelClient = new PixelSender(liveConnectConfig, callHandler, onPixelLoad, onPixelPreload);
    const resolver = IdentityResolver(postManagedState.data, storageHandler, callHandler);
    const _push = (...args) => _processArgs(args, pixelClient, postManagedState);
    return {
      push: _push,
      fire: () => _push({}),
      peopleVerifiedId: postManagedState.data.peopleVerifiedId,
      ready: true,
      resolve: resolver.resolve,
      resolutionCallUrl: resolver.getUrl,
      config: liveConnectConfig
    }
  } catch (x) {
    error('LCConstruction', 'Failed to build LC', x);
  }
}
function StandardLiveConnect (liveConnectConfig, externalStorageHandler, externalCallHandler) {
  try {
    const queue = window.liQ || [];
    const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {};
    window && (window.liQ = _getInitializedLiveConnect(configuration) || _standardInitialization(configuration, externalStorageHandler, externalCallHandler) || queue);
    if (isArray(queue)) {
      for (let i = 0; i < queue.length; i++) {
        window.liQ.push(queue[i]);
      }
    }
  } catch (x) {
    error('LCConstruction', 'Failed to build LC', x);
  }
  return window.liQ
}

export { StandardLiveConnect };
