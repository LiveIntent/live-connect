import { isFunction } from '../utils/types'
<<<<<<< HEAD:src/handlers/call-handler.ts
import * as emitter from '../utils/emitter'
import { ExternalCallHandler, ICallHandler } from '../types'

const _noOp = () => undefined

export function CallHandler (externalCallHandler: ExternalCallHandler): ICallHandler {
=======

/**
 * @typedef {Object} CallHandler
 * @property {function} [ajaxGet]
 * @property {function} [pixelGet]
 */

const _noOp = () => undefined

/**
 * @param {CallHandler} externalCallHandler
 * @param {EventBus} eventBus
 * @returns {CallHandler}
 * @constructor
 */
export function CallHandler (externalCallHandler, eventBus) {
>>>>>>> master:src/handlers/call-handler.js
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
