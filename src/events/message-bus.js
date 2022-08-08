import E from './replayemitter'
import * as C from '../utils/consts'

export function LocalMessageBus(size) {
  if (!size) {
    size = 5
  }
  return new E(size)
}

export function MessageBus (globalName, localName, errorCallback, size) {
  if (!size) {
    size = 5
  }

  try {
    console.log('events.bus.init')
    if (!window) {
      errorCallback(new Error('Bus can only be attached to the window, which is not present'))
    }
    if (window && !window[globalName]) {
      window[globalName] = new E(size)
    }
    if (window && !window[localName]) {
      window[localName] = new E(size)
    }

    return {
      on: function (name, callback, ctx) {
        window && window[localName] && window[localName].on(name, callback, ctx)
      },
      once: function (name, callback, ctx) {
        window && window[localName] && window[localName].once(name, callback, ctx)
      },
      emit: function (name, message) {
        window && window[localName] && window[localName].emit(name, message)
        window && window[globalName] && window[globalName].emit(name, message)
      },
      emitError: function (name, message, e = {}) {
        const wrapped = new Error(message || e.message)
        wrapped.stack = e.stack
        wrapped.name = name || 'unknown error'
        wrapped.lineNumber = e.lineNumber
        wrapped.columnNumber = e.columnNumber
        this.emit(C.ERRORS_PREFIX, wrapped)
      },
      encodeEmitError (name, exception) {
        this.emitError(name, exception.message, exception)
      },
      off: function (name, callback) {
        window && window[localName] && window[localName].off(name, callback)
      }
    }
  } catch (e) {
    console.error('events.bus.init', e)
    errorCallback(e)
  }
}
