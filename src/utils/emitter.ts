import * as C from './consts'

function _emit (prefix: string, message: string | object): void {
  window && window[C.EVENT_BUS_NAMESPACE] && window[C.EVENT_BUS_NAMESPACE].emit(prefix, message)
}

export function send (prefix: string, message: string | object): void {
  _emit(prefix, message)
}

export function fromError (name: string, exception: Error): void {
  error(name, exception.message, exception)
}

export function error (name: string, message: string, e: any = {}): void {
  const wrapped = new Error(message)
  wrapped.stack = e.stack
  wrapped.name = name || 'unknown error'
  _emit(C.ERRORS_PREFIX, wrapped)
}
