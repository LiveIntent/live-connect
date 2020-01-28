/**
 * @typedef {Object} StorageOptions
 * @property {(number| Date |undefined)} [expires]
 * @property {(string|undefined)} [domain]
 * @property {(string|undefined)} [path]
 * @property {(boolean|undefined)} [secure]
 * @property {(boolean|undefined)} [httponly]
 * @property {((''|'Strict'|'Lax')|undefined)} [samesite]
 */
import { StorageStrategy } from '../model/storage-strategy'
import * as cookies from 'browser-cookies'
import * as emitter from './emitter'
import { strEqualsIgnoreCase } from './types'

let _hasLocalStorage = null

/**
 * @returns {boolean}
 * @private
 */
export function hasLocalStorage () {
  if (_hasLocalStorage == null) {
    _hasLocalStorage = _checkLocalStorage()
  }
  return _hasLocalStorage
}

/**
 * @returns {boolean}
 * @private
 */
export function _checkLocalStorage () {
  let enabled = false
  try {
    if (window && window.localStorage) {
      const key = Math.random().toString()
      window.localStorage.setItem(key, key)
      enabled = window.localStorage.getItem(key) === key
      window.localStorage.removeItem(key)
    }
  } catch (e) {
    emitter.error('LSCheckError', 'Error while checking LS', e)
  }
  return enabled
}

/**
 * @param {number} days
 * @returns {number}
 * @private
 */
function _addDays (days) {
  return new Date().getTime() + (days * 864e5)
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
export function getFromLs (key) {
  let ret = null
  if (hasLocalStorage()) {
    ret = _unsafeGetFromLs(key)
  }
  return ret
}

/**
 * @param keyLike
 * @return {[String]}
 */
export function findSimilarInJar (keyLike) {
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
 * @param {StorageOptions} storageOptions
 * @returns void
 */
export function setCookie (key, value, storageOptions) {
  cookies.set(key, value, storageOptions)
}

/**
 * @param {string} key
 * @param {string} value
 * @param {StorageOptions} storageOptions
 * @returns {string|null}
 * @private
 */
function _cookieGetOrAdd (key, value, storageOptions) {
  let ret = null
  try {
    const oldCookie = getCookie(key)
    if (oldCookie) {
      setCookie(key, oldCookie, storageOptions)
    } else {
      setCookie(key, value, storageOptions)
    }
    ret = getCookie(key)
  } catch (e) {
    emitter.error('CookieGetOrAdd', 'Failed manipulating cookie jar', e)
  }
  return ret
}

/**
 * @param {string} key
 * @returns {string|null}
 * @private
 */
export function fetchFromLs (key) {
  let ret = null
  try {
    if (hasLocalStorage()) {
      ret = _unsafeGetFromLs(key)
    }
  } catch (e) {
    emitter.error('LSFetch', 'Failed fething key from ls', e)
  }
  return ret
}

/**
 * @param {string} key
 * @returns {string|null}
 */
export function removeFromLs (key) {
  if (hasLocalStorage()) {
    window.localStorage.removeItem(key)
  }
}

/**
 * @param {string} key
 * @param {string} value
 * @returns {string|null}
 */
export function addToLs (key, value) {
  if (hasLocalStorage()) {
    window.localStorage.setItem(key, value)
  }
}

/**
 * @param {string} key
 * @param {string} value
 * @param {StorageOptions} storageOptions
 * @returns {string|null}
 * @private
 */
function _lsGetOrAdd (key, value, storageOptions) {
  let ret = null
  try {
    if (hasLocalStorage()) {
      const expirationKey = `${key}_exp`
      const oldLsExpirationEntry = fetchFromLs(expirationKey)
      const expiry = _addDays(storageOptions.expires)
      if (oldLsExpirationEntry && parseInt(oldLsExpirationEntry) <= new Date().getTime()) {
        removeFromLs(key)
      }
      const oldLsEntry = fetchFromLs(key)
      if (!oldLsEntry) {
        addToLs(key, value)
      }
      addToLs(expirationKey, `${expiry}`)
      ret = fetchFromLs(key)
    }
  } catch (e) {
    emitter.error('LSGetOrAdd', 'Error manipulating LS', e)
  }
  return ret
}

/**
 * @param {string} key
 * @param {string} value
 * @param {StorageOptions} storageOptions
 * @param {string|null} storageStrategy
 * @returns {string|null}
 * @private
 */
export function getOrAddWithExpiration (key, value, storageOptions, storageStrategy) {
  if (strEqualsIgnoreCase(storageStrategy, StorageStrategy.localStorage)) {
    return _lsGetOrAdd(key, value, storageOptions)
  } else if (strEqualsIgnoreCase(storageStrategy, StorageStrategy.none)) {
    return null
  } else {
    return _cookieGetOrAdd(key, value, storageOptions)
  }
}
