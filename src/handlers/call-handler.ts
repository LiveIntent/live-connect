import { isFunction } from '../utils/types'
import * as emitter from '../utils/emitter'

export interface ExternalCallHandler {
  ajaxGet?: (
    url: string,
    onSuccess: (responseText: string) => void,
    onError?: (error: any) => void,
    timeout?: number
  ) => void,
  pixelGet?: (
    url: string,
    onLoad?: () => void
  ) => void
}

export interface CallHandler {
  ajaxGet: (
    url: string,
    onSuccess: (responseText: string) => void,
    onError?: (error: any) => void,
    timeout?: number
  ) => void,
  pixelGet: (
    url: string,
    onLoad?: () => void
  ) => void
}

const _noOp = () => undefined

// wrap an external CallHandler
export function fromExternalCallHandler (externalCallHandler: ExternalCallHandler): CallHandler {
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
