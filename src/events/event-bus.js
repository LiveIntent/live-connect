import { E, wrapError } from './replayemitter'
import * as C from '../utils/consts'
import { isFunction } from '../utils/types'

/**
 * @typedef {Object} EventBus
 * @property {(function)} on
 * @property {(function)} once
 * @property {(function)} emit
 * @property {(function)} off
 * @property {(function)} emitErrorWithMessage
 * @property {(function)} emitError
 * @property {(number)} size
 */

function initBus (size) {
  if (!size) {
    size = 5
  }
  return new E(size)
}

function extendBusIfNeeded (bus) {
  if (isFunction(bus.emitErrorWithMessage) && isFunction(bus.emitError)) {
    return
  }

  bus.emitErrorWithMessage = function (name, message, e = {}) {
    const wrappedError = wrapError(name, message, e)
    bus.emit(C.ERRORS_PREFIX, wrappedError)
  }

  bus.emitError = function (name, exception) {
    bus.emitErrorWithMessage(name, exception.message, exception)
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

export function getAvailableBus (name) {
  const eventBus = window[name].eventBus || window[C.EVENT_BUS_NAMESPACE]
  extendBusIfNeeded(eventBus)
  return eventBus
}
