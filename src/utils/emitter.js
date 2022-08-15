import * as C from '../utils/consts'

function _emit (prefix, message) {
  window && window[C.EVENT_BUS_NAMESPACE] && window[C.EVENT_BUS_NAMESPACE].emit(prefix, message)
}

export function send (prefix, message) {
  _emit(prefix, message)
}

export function fromError (name, exception) {
  error(name, exception.message, exception)
}

export function error (name, message, e = {}) {
  const wrapped = new Error(message || e.message)
  wrapped.stack = e.stack
  wrapped.name = name || 'unknown error'
  wrapped.lineNumber = e.lineNumber
  wrapped.columnNumber = e.columnNumber
  _emit(C.ERRORS_PREFIX, wrapped)
}
