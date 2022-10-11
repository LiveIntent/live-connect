import E from './replayemitter'
import * as C from '../utils/consts'

function initBus (size) {
  if (!size) {
    size = 5
  }
  return new E(size)
}

function isWrapped (bus) {
  return typeof bus.emitError === 'function' && typeof bus.encodeEmitError === 'function'
}

function wrap (bus) {
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

export function LocalEventBus (size) {
  const bus = initBus(size)
  return wrap(bus)
}

export function GlobalEventBus (name, size, errorCallback) {
  try {
    console.log('events.bus.init')
    if (!window) {
      errorCallback(new Error('Bus can only be attached to the window, which is not present'))
    }
    if (window && !window[name]) {
      window[name] = wrap(initBus(size))
    }
    if (!isWrapped(window[name])) {
      window[name] = wrap(window[name])
    }
    return window[name]
  } catch (e) {
    console.error('events.bus.init', e)
    errorCallback(e)
  }
}

export function getAndAttachWrappedGlobalBus (name) {
  const eventBus = window[name].eventBus || (window[C.EVENT_BUS_NAMESPACE] && wrap(window[C.EVENT_BUS_NAMESPACE]))
  window[name].eventBus = eventBus
  return eventBus
}
