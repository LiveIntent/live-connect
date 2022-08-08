import * as C from '../utils/consts'

export function Emitter (globalBus, localBus) {
  function _emit (prefix, message) {
    globalBus && globalBus.emit(prefix, message)
    localBus && localBus.emit(prefix, message)
  }

  function _fromError (name, exception) {
    _error(name, exception.message, exception)
  }

  function _error (name, message, e = {}) {
    const wrapped = new Error(message || e.message)
    wrapped.stack = e.stack
    wrapped.name = name || 'unknown error'
    wrapped.lineNumber = e.lineNumber
    wrapped.columnNumber = e.columnNumber
    _emit(C.ERRORS_PREFIX, wrapped)
  }

  return {
    emit: _emit,
    fromError: _fromError,
    error: _emit
  }
}

export function NoOpEmitter () {
  return {
    emit: {},
    fromError: {},
    error: {}
  }
}

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
