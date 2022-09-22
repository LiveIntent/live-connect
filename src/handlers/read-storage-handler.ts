import { isFunction, strEqualsIgnoreCase } from '../utils/types'
import { StorageStrategy } from '../model/storage-strategy'
import * as emitter from '../utils/emitter'
import { MinimalStorageHandler } from './types'

// create a ReadStorageHandler from an external storage handler. Undefined functions will be replaced by an default
// implementation.
export function minimalFromExternalStorageHandler (storageStrategy: string, externalStorageHandler: object): MinimalStorageHandler {
  const errors = []
  function _externalOrError (functionName: string) {
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

  const _orElseNoOp = (fName: string) =>
    strEqualsIgnoreCase(storageStrategy, StorageStrategy.none) ? _noOp : _externalOrError(fName)

  const handler = {
    getCookie: _externalOrError('getCookie'),
    getDataFromLocalStorage: _externalOrError('getDataFromLocalStorage'),
    localStorageIsEnabled: _orElseNoOp('localStorageIsEnabled')
  }
  if (errors.length > 0) {
    emitter.error('StorageHandler', `The storage functions '${JSON.stringify(errors)}' are not provided`)
  }
  return handler
}

const _noOp = () => undefined
