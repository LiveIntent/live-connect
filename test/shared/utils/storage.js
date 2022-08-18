/**
 * @typedef {Object} StorageOptions
 * @property {(number| Date |undefined)} [expires]
 * @property {(string|undefined)} [domain]
 * @property {(string|undefined)} [path]
 * @property {(boolean|undefined)} [secure]
 * @property {(boolean|undefined)} [httponly]
 * @property {((''|'Strict'|'Lax')|undefined)} [samesite]
 */
import Cookies from 'js-cookie'
import * as emitter from 'live-connect-js/src/utils/emitter'

let _localStorageIsEnabled = null

const cookies = Cookies.withConverter({
  read: function (value, name) {
    try {
      return Cookies.converter.read(value, name)
    } catch (e) {
      emitter.error('CookieReadError', `Failed reading cookie ${name}`, e)
      return undefined // default implementation will return undefined if cookie is not found
    }
  }
})

/**
 * @returns {boolean}
 * @private
 */
export function localStorageIsEnabled () {
  if (_localStorageIsEnabled == null) {
    _localStorageIsEnabled = _checkLocalStorage()
  }
  return _localStorageIsEnabled
}

/**
 * @returns {boolean}
 * @private
 */
function _checkLocalStorage () {
  let enabled = false
  try {
    if (window && window.localStorage) {
      const key = Math.random().toString()
      window.localStorage.setItem(key, key)
      enabled = window.localStorage.getItem(key) === key
      window.localStorage.removeItem(key)
    }
  } catch (e) {
    emitter.error('LSCheckError', e.message, e)
  }
  return enabled
}

/**
 * @param {string} key
 * @returns {string|null}
 */
export function getCookie (key) {
  return cookies.get(key)
}

/**
 * @param key
 * @return {string|null}
 * @private
 */
function _unsafeGetFromLs (key) {
  return window.localStorage.getItem(key)
}

/**
 * @param {string} key
 * @returns {string|null}
 */
export function getDataFromLocalStorage (key) {
  let ret = null
  if (localStorageIsEnabled()) {
    ret = _unsafeGetFromLs(key)
  }
  return ret
}

/**
 * @param keyLike
 * @return {[String]}
 */
export function findSimilarCookies (keyLike) {
  try {
    const allCookies = cookies.get()
    return Object.keys(allCookies).filter(key => key.indexOf(keyLike) >= 0 && allCookies[key] !== undefined).map(key => allCookies[key])
  } catch (e) {
    emitter.error('CookieFindSimilarInJar', 'Failed fetching from a cookie jar', e)
    return []
  }
}

/**
 * @param {string} key
 * @param {string} value
 * @param {string} expires
 * @param {string} sameSite
 * @param {string} domain
 * @returns void
 */
export function setCookie (key, value, expires, sameSite, domain) {
  cookies.set(key, value, { domain: domain, expires: expires, samesite: sameSite })
}

/**
 * @param {string} key
 * @returns {string|null}
 */
export function removeDataFromLocalStorage (key) {
  if (localStorageIsEnabled()) {
    window.localStorage.removeItem(key)
  }
}
