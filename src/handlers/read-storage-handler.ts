import { isFunction, strEqualsIgnoreCase } from '../utils/types'
import { StorageStrategy } from '../model/storage-strategy'
<<<<<<< HEAD:src/handlers/read-storage-handler.ts
import * as emitter from '../utils/emitter'
import { ExternalMinimalStorageHandler, IMinimalStorageHandler, StorageStrategyMode } from '../types'
=======
>>>>>>> master:src/handlers/read-storage-handler.js

const _noOp = () => undefined

<<<<<<< HEAD:src/handlers/read-storage-handler.ts
export function StorageHandler (storageStrategy: StorageStrategyMode, externalStorageHandler: ExternalMinimalStorageHandler): IMinimalStorageHandler {
=======
/**
 *
 * @param {string} storageStrategy
 * @param {StorageHandler} [externalStorageHandler]
 * @param {EventBus} eventBus
 * @return {StorageHandler}
 * @constructor
 */
export function StorageHandler (storageStrategy, externalStorageHandler, eventBus) {
>>>>>>> master:src/handlers/read-storage-handler.js
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
    eventBus.emitErrorWithMessage('StorageHandler', `The storage functions '${JSON.stringify(errors)}' are not provided`)
  }
  return handler
}
