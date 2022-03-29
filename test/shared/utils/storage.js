/**
 * @typedef {Object} StorageOptions
 * @property {(number| Date |undefined)} [expires]
 * @property {(string|undefined)} [domain]
 * @property {(string|undefined)} [path]
 * @property {(boolean|undefined)} [secure]
 * @property {(boolean|undefined)} [httponly]
 * @property {((''|'Strict'|'Lax')|undefined)} [samesite]
 */
import * as cookies from 'browser-cookies'
import * as emitter from '../../../src/utils/emitter'

let _localStorageIsEnabled = null

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
  const key = '__live-connect-localstorage-probe'
  try {
    if (window && window.localStorage) {
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
  const ret = []
  try {
    const allCookies = cookies.all()
    for (const cookieName in allCookies) {
      if (allCookies[cookieName] && cookieName.indexOf(keyLike) >= 0) {
        ret.push(cookies.get(cookieName))
      }
    }
  } catch (e) {
    emitter.error('CookieFindSimilarInJar', 'Failed fetching from a cookie jar', e)
  }
  return ret
}

/**
 * @param {string} key
 * @param {string} value
 * @param {number} expires
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

/**
 * @param {string} key
 * @param {string} value
 * @returns {string|null}
 */
export function setDataInLocalStorage (key, value) {
  if (localStorageIsEnabled()) {
    window.localStorage.setItem(key, value)
  }
}
