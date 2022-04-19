import { isFunction, strEqualsIgnoreCase } from '../utils/types'
import { StorageStrategy } from '../model/storage-strategy'
import * as emitter from '../utils/emitter'

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
const _noOp = () => undefined

/**
 *
 * @param {string} storageStrategy
 * @param {StorageHandler} [externalStorageHandler]
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

  const handler = {
    localStorageIsEnabled: _orElseNoOp('localStorageIsEnabled'),
    getCookie: _externalOrError('getCookie'),
    getDataFromLocalStorage: _externalOrError('getDataFromLocalStorage')
  }
  if (errors.length > 0) {
    emitter.error('StorageHandler', `The storage functions '${JSON.stringify(errors)}' are not provided`)
  }
  return handler
}
