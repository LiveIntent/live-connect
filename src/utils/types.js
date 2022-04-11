export const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const uuidRegex = new RegExp(`^${UUID}$`, 'i')

/**
 * @param {*} value
 * @returns {string}
 */
export function safeToString (value) {
  return typeof value === 'object' ? JSON.stringify(value) : ('' + value)
}

/**
 * Checks whether the param NOT `null` and NOT `undefined`
 * @param {*} value
 * @returns {boolean}
 */
export function isNonEmpty (value) {
  return typeof value !== 'undefined' && value !== null && trim(value).length > 0
}

export function isUUID (value) {
  return value && uuidRegex.test(trim(value))
}

/**
 * @param {*} arr
 * @returns {boolean}
 */
export function isArray (arr) {
  return Object.prototype.toString.call(arr) === '[object Array]'
}

const hasTrim = !!String.prototype.trim

/**
 * @param value
 * @return {string}
 */
export function trim (value) {
  return hasTrim ? ('' + value).trim() : ('' + value).replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')
}

/**
 * @param {*} str
 * @returns {boolean}
 */
export function isString (str) {
  return typeof str === 'string'
}

/**
 * @param fistStr
 * @param secondStr
 * @return {boolean}
 */
export function strEqualsIgnoreCase (fistStr, secondStr) {
  return isString(fistStr) && isString(secondStr) && trim(fistStr.toLowerCase()) === trim(secondStr.toLowerCase())
}

/**
 * @param obj
 * @return {boolean}
 */
export function isObject (obj) {
  return !!obj && typeof obj === 'object' && !isArray(obj)
}

/**
 * @param fun
 * @return {boolean}
 */
export function isFunction (fun) {
  return fun && typeof fun === 'function'
}

/**
 * Returns the string representation when something should expire
 * @param expires
 * @return {Date}
 */
export function expiresInDays (expires) {
  return _expiresIn(expires, 864e5)
}

function _expiresIn (expires, number) {
  return new Date((new Date().getTime() + (expires * number)))
}

/**
 * Returns the string representation when something should expire
 * @param expires
 * @return {Date}
 */
export function expiresInHours (expires) {
  return _expiresIn(expires, 36e5)
}

export function asParamOrEmpty (param, value, transform) {
  return isNonEmpty(value) ? ([param, isFunction(transform) ? transform(value) : value]) : []
}

export function asStringParam (param, value) {
  return asParamOrEmpty(param, value, (s) => encodeURIComponent(s))
}

export function asStringParamTransform (param, value, transform) {
  return asParamOrEmpty(param, value, (s) => encodeURIComponent(transform(s)))
}

export function asStringParamOrEmptyWhen (param, value, predicate) {
  return (isNonEmpty(value) && isFunction(predicate) && predicate(value)) ? [param, encodeURIComponent(value)] : []
}

export function mapAsParams (paramsMap) {
  if (paramsMap && isObject(paramsMap)) {
    const array = []
    Object.keys(paramsMap).forEach((key) => {
      const value = paramsMap[key]
      value && !isObject(value) && value.length && array.push([encodeURIComponent(key), encodeURIComponent(value)])
    })
    return array
  } else {
    return []
  }
}
export function merge (obj1, obj2) {
  const res = {}
  const clean = (obj) => isObject(obj) ? obj : {}
  const first = clean(obj1)
  const second = clean(obj2)
  Object.keys(first).forEach(function (key) {
    res[key] = first[key]
  })
  Object.keys(second).forEach(function (key) {
    res[key] = second[key]
  })
  return res
}
