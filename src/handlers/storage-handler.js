import { isFunction, strEqualsIgnoreCase } from '../utils/types'
import { StorageStrategy } from '../model/storage-strategy'
import * as emitter from '../utils/emitter'

/**
 * @typedef {Object} ExternalStorageHandler
 * @property {function} [localStorageIsEnabled]
 * @property {function} [getCookie]
 * @property {function} [setCookie]
 * @property {function} [getDataFromLocalStorage]
 * @property {function} [removeDataFromLocalStorage]
 * @property {function} [setDataInLocalStorage]
 * @property {function} [findSimilarCookies]
 */

/**
 * @typedef {Object} StorageHandler
 * @property {function} [get]
 * @property {function} [set]
 */
const _noOp = () => undefined

/**
 *
 * @param {string} storageStrategy
 * @param {ExternalStorageHandler} [externalStorageHandler]
 * @return {StorageHandler}
 * @constructor
 */
export function StorageHandler (storageStrategy, externalStorageHandler) {
  const errors = []

  function _externalOrError (functionName) {
    const hasExternal = externalStorageHandler && externalStorageHandler[functionName] && isFunction(externalStorageHandler[functionName])
    if (strEqualsIgnoreCase(storageStrategy, StorageStrategy.disabled)) {
      return _noOp
    } else if (hasExternal) {
      return externalStorageHandler[functionName]
    } else {
      errors.push(functionName)
      return _noOp
    }
  }

  const _orElseNoOp = (fName) => strEqualsIgnoreCase(storageStrategy, StorageStrategy.none) ? _noOp : _externalOrError(fName)

  const functions = {
    localStorageIsEnabled: _orElseNoOp('localStorageIsEnabled'),
    getCookie: _externalOrError('getCookie'),
    setCookie: _orElseNoOp('setCookie'),
    getDataFromLocalStorage: _externalOrError('getDataFromLocalStorage'),
    removeDataFromLocalStorage: _orElseNoOp('removeDataFromLocalStorage'),
    setDataInLocalStorage: _orElseNoOp('setDataInLocalStorage'),
    findSimilarCookies: _externalOrError('findSimilarCookies')
  }
  if (errors.length > 0) {
    emitter.error('StorageHandler', `The storage functions '${JSON.stringify(errors)}' are not provided`)
  }

  return {
    get: key => {
      if (strEqualsIgnoreCase(storageStrategy, StorageStrategy.none) || strEqualsIgnoreCase(storageStrategy, StorageStrategy.disabled)) {
        return null
      } else if (strEqualsIgnoreCase(storageStrategy, StorageStrategy.localStorage)) {
        if (functions.localStorageIsEnabled()) {
          const expirationKey = `${key}_exp`
          const oldLsExpirationEntry = functions.getDataFromLocalStorage(expirationKey)
          if (oldLsExpirationEntry && Date.parse(oldLsExpirationEntry) <= new Date().getTime()) {
            functions.removeDataFromLocalStorage(key)
          }
          return functions.getDataFromLocalStorage(key)
        } else {
          return null
        }
      } else {
        return functions.getCookie(key)
      }
    },
    set: (key, value, expirationDate, domain) => {
      if (strEqualsIgnoreCase(storageStrategy, StorageStrategy.none) || strEqualsIgnoreCase(storageStrategy, StorageStrategy.disabled)) {
      } else if (strEqualsIgnoreCase(storageStrategy, StorageStrategy.localStorage)) {
        if (functions.localStorageIsEnabled()) {
          const expirationKey = `${key}_exp`
          functions.setDataInLocalStorage(key, value)
          functions.setDataInLocalStorage(expirationKey, `${expirationDate}`)
        }
      } else {
        functions.setCookie(key, value, expirationDate.toUTCString(), 'Lax', domain)
      }
    },
    localStorageIsEnabled: functions.localStorageIsEnabled,
    getCookie: functions.getCookie,
    setCookie: functions.setCookie,
    getDataFromLocalStorage: functions.getDataFromLocalStorage,
    removeDataFromLocalStorage: functions.removeDataFromLocalStorage,
    setDataInLocalStorage: functions.setDataInLocalStorage,
    findSimilarCookies: functions.findSimilarCookies
  }
}
