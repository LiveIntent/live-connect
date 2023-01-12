import { isFunction } from '../utils/types'
import { EventBus, ExternalCallHandler, ICallHandler } from '../types'

const _noOp = () => undefined

export function CallHandler (externalCallHandler: ExternalCallHandler, eventBus: EventBus): ICallHandler {
  const errors = []

  function _externalOrError (functionName: string) {
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
    eventBus.emitErrorWithMessage('CallHandler', `The call functions '${JSON.stringify(errors)}' are not provided`)
  }

  return handler
}
