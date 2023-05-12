import { ReplayEmitter, wrapError, isFunction, ERRORS_CHANNEL, EventBus } from 'live-connect-common'
import * as C from '../utils/consts'

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

  bus.emitErrorWithMessage = function (name, message, e: Error) {
    const wrappedError = wrapError(name, e, message)
    return bus.emit(ERRORS_CHANNEL, wrappedError)
  }

  bus.emitError = function (name, exception: Error) {
    return bus.emitErrorWithMessage(name, exception.message, exception)
  }
}

export function LocalEventBus(size = 5) {
  return initBus(size)
}

// @ts-expect-error
export function GlobalEventBus(name: string, size: number, errorCallback: (error: unknown) => void): EventBus {
  try {
    if (!window) {
      errorCallback(new Error('Bus can only be attached to the window, which is not present'))
    } else {
      if (!window[name]) window[name] = initBus(size)

      extendBusIfNeeded(window[name] as EventBus)
      return window[name] as EventBus
    }
  } catch (e) {
    console.error('events.bus.init', e)
    errorCallback(e)
  }
}

export function getAvailableBus(name: string): EventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventBus: EventBus = ((window[name] || {} as any).eventBus || window[C.EVENT_BUS_NAMESPACE]) as EventBus
  extendBusIfNeeded(eventBus)
  return eventBus
}
