import { isFunction } from '../utils/types'
import * as emitter from '../utils/emitter'

/**
 * @typedef {Object} CallHandler
 * @property {function} [ajaxGet]
 * @property {function} [pixelGet]
 */

const _noOp = () => undefined

/**
 * @param {CallHandler} externalCallHandler
 * @returns {CallHandler}
 * @constructor
 */
export function CallHandler (externalCallHandler) {
  const errors = []

  function _externalOrError (functionName) {
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
