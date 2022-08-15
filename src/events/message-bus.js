import E from './replayemitter'
import * as C from '../utils/consts'

export function LocalMessageBus (size) {
  if (!size) {
    size = 5
  }
  const bus = new E(size)
  return wrap(bus)
}

export function GlobalMessageBus(name, size, errorCallback) {
  if (!size) {
    size = 5
  }
  try {
    console.log('events.bus.init')
    if (!window) {
      errorCallback(new Error('Bus can only be attached to the window, which is not present'))
    }
    if (window && !window[name]) {
      window[name] = new E(size)
    }
    return wrap(window[name])
  } catch (e) {
    console.error('events.bus.init', e)
    errorCallback(e)
  }
}

function wrap(bus) {
  return {
    on: function (name, callback, ctx) {
      bus.on(name, callback, ctx)
    },
    once: function (name, callback, ctx) {
      bus.once(name, callback, ctx)
    },
    emit: function (name, message) {
      bus.emit(name, message)
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
      bus.off(name, callback)
    },
    underlying: bus
  }
}

