import E from './replayemitter'
import * as C from '../utils/consts'

export function LocalEventBus (size) {
  if (!size) {
    size = 5
  }
  const bus = new E(size)
  return wrap(bus)
}

export function GlobalEventBus(name, size, errorCallback) {
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

export function wrap(bus) {
  return {
    on: bus.on,
    once: bus.once, 
    emit: bus.emit,
    off: bus.off,

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
    underlying: bus
  }
}

