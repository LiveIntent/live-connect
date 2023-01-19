import { isFunction, strEqualsIgnoreCase } from '../utils/types'
import { StorageStrategy } from '../model/storage-strategy'
import { EventBus, ExternalMinimalStorageHandler, IMinimalStorageHandler, StorageStrategyMode } from '../types'

const _noOp = () => undefined

export function StorageHandler (storageStrategy: StorageStrategyMode, externalStorageHandler: ExternalMinimalStorageHandler, eventBus: EventBus): IMinimalStorageHandler {
  const errors = []
  function _externalOrError (functionName) {
    const hasExternal = externalStorageHandler && externalStorageHandler[functionName] && isFunction(externalStorageHandler[functionName])
    if (strEqualsIgnoreCase(storageStrategy, StorageStrategy.disabled)) {
      return _noOp
    } else if (hasExternal) {
      return externalStorageHandler[functionName].bind(externalStorageHandler)
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
