export const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const uuidRegex = new RegExp(`^${UUID}$`, 'i')

/**
 * @param {*} value
 * @returns {string}
 */
export function safeToString (value) {
  return typeof value === 'object' ? JSON.stringify(value) : ('' + value)
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
 * @return {string}
 */
export function expiresInDays (expires) {
  return new Date((new Date().getTime() + (expires * 864e5))).toUTCString()
}
