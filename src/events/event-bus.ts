import { ReplayEmitter, wrapError } from './replayemitter'
import * as C from '../utils/consts'
import { isFunction } from '../utils/types'
import { EventBus } from '../types'

function initBus (size?: number): EventBus {
  if (typeof size === 'undefined') {
    size = 5
  }
  return new ReplayEmitter(size)
}

function extendBusIfNeeded (bus: EventBus) {
  if (isFunction(bus.emitErrorWithMessage) && isFunction(bus.emitError)) {
    return
  }

  bus.emitErrorWithMessage = function (name, message, e = {}) {
    const wrappedError = wrapError(name, message, e)
    return bus.emit(C.ERRORS_PREFIX, wrappedError)
  }

  bus.emitError = function (name, exception) {
    return bus.emitErrorWithMessage(name, exception.message, exception)
  }
}

export function LocalEventBus (size: number) {
  return initBus(size)
}

export function GlobalEventBus (name: string, size: number, errorCallback: (error: any) => void) {
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

export function getAvailableBus (name: string) {
  const eventBus = window[name].eventBus || window[C.EVENT_BUS_NAMESPACE]
  extendBusIfNeeded(eventBus)
  return eventBus
}
