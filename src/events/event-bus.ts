import { ReplayEmitter, wrapError } from './replayemitter'
import * as C from '../utils/consts'
import { isFunction } from '../utils/types'
import { EventBus } from '../types'

function initBus (size?: number | unknown): EventBus {
  if (typeof size === 'number')
    return new ReplayEmitter(size)
  else {
    return new ReplayEmitter(5)
  }
}

function extendBusIfNeeded (bus: EventBus): void {
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

export function LocalEventBus (size = 5) {
  return initBus(size)
}

export function GlobalEventBus (name: keyof Window, size: number, errorCallback: (error: unknown) => void): EventBus | undefined {
  try {
    if (!window) {
      errorCallback(new Error('Bus can only be attached to the window, which is not present'))
    }
    if (window && !window[name]) {
      (window[name] as EventBus) = initBus(size)
    }
    extendBusIfNeeded(window[name])
    return window[name]
  } catch (e: unknown) {
    console.error('events.bus.init', e)
    errorCallback(e)
  }
}

export function getAvailableBus (name: keyof Window): EventBus {
  const eventBus = window[name].eventBus || window[C.EVENT_BUS_NAMESPACE]
  extendBusIfNeeded(eventBus)
  return eventBus
}
