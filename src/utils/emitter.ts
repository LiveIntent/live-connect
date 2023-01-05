import * as C from '../utils/consts'

function _emit (prefix: string, message: any) {
  window && window[C.EVENT_BUS_NAMESPACE] && window[C.EVENT_BUS_NAMESPACE].emit(prefix, message)
}

export function send (prefix: string, message: any) {
  _emit(prefix, message)
}

export function fromError (name: string, exception: Error) {
  error(name, exception.message, exception)
}

export function error (name: string, message: string, e: any = {}) {
  const wrapped: any = new Error(message || e.message)
  wrapped.stack = e.stack
  wrapped.name = name || 'unknown error'
  wrapped.lineNumber = e.lineNumber
  wrapped.columnNumber = e.columnNumber
  _emit(C.ERRORS_PREFIX, wrapped)
}
