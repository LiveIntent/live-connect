import { isFunction, strEqualsIgnoreCase } from '../utils/types'
import { StorageStrategy } from '../model/storage-strategy'
import * as lcStorage from '../utils/storage'

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
const _noOp = () => undefined

/**
 *
 * @param {string} storageStrategy
 * @param {StorageHandler} [externalStorageHandler]
 * @return {StorageHandler}
 * @constructor
 */
export function StorageHandler (storageStrategy, externalStorageHandler) {
  function _externalOrDefault (functionName) {
    const hasExternal = externalStorageHandler && externalStorageHandler[functionName] && isFunction(externalStorageHandler[functionName])
    if (hasExternal) {
      return externalStorageHandler[functionName]
    } else {
      return lcStorage[functionName] || _noOp
    }
  }
  const _orElseNoOp = (fName) => strEqualsIgnoreCase(storageStrategy, StorageStrategy.none) ? _noOp : _externalOrDefault(fName)
  return {
    hasLocalStorage: _orElseNoOp('hasLocalStorage'),
    getCookie: _externalOrDefault('getCookie'),
    setCookie: _orElseNoOp('setCookie'),
    getDataFromLocalStorage: _externalOrDefault('getDataFromLocalStorage'),
    removeDataFromLocalStorage: _orElseNoOp('removeDataFromLocalStorage'),
    setDataInLocalStorage: _orElseNoOp('setDataInLocalStorage'),
    findSimilarCookies: _externalOrDefault('findSimilarCookies')
  }
}
