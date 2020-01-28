import { PixelSender } from '../pixel/sender'
import { StateWrapper } from '../pixel/state'
import * as page from '../enrichers/page'
import * as C from '../utils/consts'
import { isFunction } from '../utils/types'

let _state = null
let _pixelSender = null
const MAX_ERROR_FIELD_LENGTH = 120

const _defaultReturn = {
  errorDetails: {
    message: 'Unknown message',
    name: 'Unknown name'
  }
}

function _asInt (field) {
  try {
    const intValue = field * 1
    return isNaN(intValue) ? undefined : intValue
  } catch {

  }
}

function _truncate (value) {
  try {
    if (value && value.length && value.length > MAX_ERROR_FIELD_LENGTH) {
      return `${value.substr(0, MAX_ERROR_FIELD_LENGTH)}...`
    } else {
      return value
    }
  } catch {
  }
}

/**
 * @param {Error} e
 * @return {State}
 */
export function asErrorDetails (e) {
  if (e) {
    return {
      errorDetails: {
        message: _truncate(e.message),
        name: _truncate(e.name),
        stackTrace: _truncate(e.stack),
        lineNumber: _asInt(e.lineNumber),
        lineColumn: _asInt(e.lineColumn),
        fileName: _truncate(e.fileName)
      }
    }
  } else {
    return _defaultReturn
  }
}

/**
 * @param {Error} error
 * @private
 */
function _pixelError (error) {
  console.log(error, _state)
  if (_pixelSender) {
    _pixelSender.send(new StateWrapper(asErrorDetails(error)).combineWith(_state || {}).combineWith(page.enrich({})))
  }
}

export function register (state) {
  try {
    console.log('handlers.error.register', state, _pixelSender)
    if (window && window[C.EVENT_BUS_NAMESPACE] && isFunction(window[C.EVENT_BUS_NAMESPACE].on)) {
      window[C.EVENT_BUS_NAMESPACE].on(C.ERRORS_PREFIX, _pixelError)
    }
    _pixelSender = new PixelSender(state, null)
    _state = state || {}
  } catch (e) {
    console.error('handlers.error.register', e)
  }
}
