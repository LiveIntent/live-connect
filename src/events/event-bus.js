import { E, wrapError } from './replayemitter'
import * as C from '../utils/consts'

function initBus (size) {
  if (!size) {
    size = 5
  }
  return new E(size)
}

function isNewEmitter (bus) {
  return typeof bus.emitError === 'function' && typeof bus.encodeEmitError === 'function'
}

function extendBusIfNeeded (bus) {
  if (isNewEmitter(bus)) {
    return
  }

  bus.emitError = function (name, message, e = {}) {
    const wrappedError = wrapError(name, message, e)
    bus.emit(C.ERRORS_PREFIX, wrappedError)
  }

  bus.encodeEmitError = function (name, exception) {
    bus.emitError(name, exception.message, exception)
  }
}

export function LocalEventBus (size) {
  return initBus(size)
}

export function GlobalEventBus (name, size, errorCallback) {
  try {
    console.log('events.bus.init')
    if (!window) {
      errorCallback(new Error('Bus can only be attached to the window, which is not present'))
    }
    if (window && !window[name]) {
      window[name] = initBus(size)
    }
    extendBusIfNeeded(window[name])
    return window[name]
  } catch (e) {
    console.error('events.bus.init', e)
    errorCallback(e)
  }
}

export function getAndAttachGlobalBus (name) {
  const eventBus = window[name].eventBus || window[C.EVENT_BUS_NAMESPACE]
  extendBusIfNeeded(eventBus)
  window[name].eventBus = eventBus
  return eventBus
}
