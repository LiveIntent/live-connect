import { isFunction, strEqualsIgnoreCase } from '../utils/types'
import { StorageStrategy } from '../model/storage-strategy'
import { EventBus, ExternalStorageHandler, IStorageHandler, StorageStrategyMode } from '../types'

const _noOp = () => undefined

export function StorageHandler (storageStrategy: StorageStrategyMode, externalStorageHandler: ExternalStorageHandler, eventBus: EventBus): IStorageHandler {
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
    eventBus.emitErrorWithMessage('StorageHandler', `The storage functions '${JSON.stringify(errors)}' are not provided`)
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
