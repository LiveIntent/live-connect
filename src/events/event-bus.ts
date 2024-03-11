// @ts-nocheck
import { ReplayEmitter, wrapError, isFunction, ERRORS_CHANNEL } from 'live-connect-common'
import { EventBus } from '../types.js'
import * as C from '../utils/consts.js'

function initBus(size?: number): EventBus {
  if (typeof size === 'number' && size >= 0) {
    return new ReplayEmitter(size)
  } else {
    return new ReplayEmitter(5)
  }
}

function extendBusIfNeeded(bus: EventBus) {
  if (isFunction(bus.emitErrorWithMessage) && isFunction(bus.emitError)) {
    return
  }

  bus.emitErrorWithMessage = function (name, message, e = {}) {
    const wrappedError = wrapError(name, message, e)
    return bus.emit(ERRORS_CHANNEL, wrappedError)
  }

  bus.emitError = function (name, exception) {
    return bus.emitErrorWithMessage(name, exception.message, exception)
  }
}

export function LocalEventBus(size = 5) {
  return initBus(size)
}

export function GlobalEventBus(name: string, size: number, errorCallback: (error: unknown) => void): EventBus {
  try {
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

export function getAvailableBus(name: string): EventBus {
  const eventBus = window[name].eventBus || window[C.EVENT_BUS_NAMESPACE]
  extendBusIfNeeded(eventBus)
  return eventBus
}
