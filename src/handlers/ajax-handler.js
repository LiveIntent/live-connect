import { isFunction } from '../utils/types'
import * as emitter from '../utils/emitter'

/**
 * @typedef {Object} AjaxHandler
 * @property {function} [get]
 */

/**
 * @param {AjaxHandler} externalAjaxHandler
 * @returns {AjaxHandler}
 * @constructor
 */
export function AjaxHandler (externalAjaxHandler) {
  if (externalAjaxHandler && externalAjaxHandler.get && isFunction(externalAjaxHandler.get)) {
    return {
      get: externalAjaxHandler.get
    }
  } else {
    emitter.error('AjaxHandler', 'The ajax function \'get\' is not provided')
    return {
      get: () => undefined
    }
  }
}
