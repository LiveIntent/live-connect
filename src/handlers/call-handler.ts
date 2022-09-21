import { isFunction } from '../utils/types'
import * as emitter from '../utils/emitter'

/**
 * @typedef {Object} CallHandler
 * @property {function} [ajaxGet]
 * @property {function} [pixelGet]
 */

export interface CallHandler {
  ajaxGet: (
    url: String,
    onSuccess: (responseText: string) => void,
    onError?: (error: any) => void,
    timeout?: number
  ) => void,
  pixelGet: (
    url: String,
    onLoad?: () => void
  ) => void
}

const _noOp = () => undefined

// wrap an external CallHandler
export function CallHandler (externalCallHandler: object): CallHandler {
  const errors = []

  function _externalOrError (functionName: string): any {
    const hasExternal = externalCallHandler && externalCallHandler[functionName] && isFunction(externalCallHandler[functionName])
    if (hasExternal) {
      return externalCallHandler[functionName]
    } else {
      errors.push(functionName)
      return _noOp
    }
  }

  const handler = {
    ajaxGet: _externalOrError('ajaxGet'),
    pixelGet: _externalOrError('pixelGet')
  }
  if (errors.length > 0) {
    emitter.error('CallHandler', `The call functions '${JSON.stringify(errors)}' are not provided`)
  }

  return handler
}
