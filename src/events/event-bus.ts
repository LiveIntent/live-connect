import { ReplayEmitter, wrapError } from './replayemitter'
import * as C from '../utils/consts'
import { isFunction, isObject } from '../utils/types'
import { ErrorBus, EventBus } from '../types'

function initBus (size?: number | unknown): EventBus {
  if (typeof size === 'number')
    return new ReplayEmitter(size)
  else {
    return new ReplayEmitter(5)
  }
}

function extendBusIfNeeded (bus: object): ErrorBus | null {
  if ('emitError' in bus && isFunction(bus.emitError) && 'emitErrorWithMessage' in bus && isFunction(bus.emitErrorWithMessage)) {
     const res = {
      emitErrorWithMessage: (name: string, message: string, e: unknown) => {
        try {
          (bus.emitErrorWithMessage as CallableFunction) (name, message, e)
          return res
        } catch (e) {
          return res
        }
      },
      emitError: (name: string, exception: unknown) => {
        try {
          (bus.emitError as CallableFunction) (name, exception)
          return res
        } catch (e) {
          return res
        }
      }
    }
    return res
  } else if ('emitError' in bus && isFunction(bus.emitError)) {
    const res = {
      emitErrorWithMessage: (name: string, message: string, e: unknown) => {
        try {
          (bus.emitError as CallableFunction) (name, e)
          return res
        } catch (e) {
          return res
        }
      },
      emitError: (name: string, exception: unknown) => {
        try {
          (bus.emitError as CallableFunction) (name, exception)
          return res
        } catch (e) {
          return res
        }
      }
    }
    return res
  } else if ('emitErrorWithMessage' in bus && isFunction(bus.emitErrorWithMessage)) {
    const res = {
      emitErrorWithMessage: (name: string, message: string, e: unknown) => {
        try {
          (bus.emitErrorWithMessage as CallableFunction) (name, message, e)
          return res
        } catch (e) {
          return res
        }
      },
      emitError: (name: string, exception: unknown) => {
        try {
          (bus.emitErrorWithMessage as CallableFunction) (name, "unknown error", exception)
          return res
        } catch (e) {
          return res
        }
      }
    }
    return res
  } else {
    return null
  }
}

export function LocalEventBus (size = 5) {
  return initBus(size)
}

export function GlobalEventBus (name: string, size: number, errorCallback: (error: unknown) => void): EventBus | null {
  try {
    if (!window) {
      errorCallback(new Error('Bus can only be attached to the window, which is not present'))
    }
    if (name in window) {
      const existing = window[name]
      if (isObject(existing)) {
        // TODO
        return extendBusIfNeeded(existing) as EventBus
      }
    } else {
      const bus = initBus(size)
      window[name] = bus
      return bus
    }
    return null
  } catch (e) {
    console.error('events.bus.init', e)
    errorCallback(e)
    return null
  }
}

export function getAvailableBus (globalVarName: string): ErrorBus | null {
  let result: ErrorBus | null = null

  if (window && globalVarName in window) {
    const obj = window[globalVarName]
    if (isObject(obj) && 'eventBus' in obj) {
      const potentialBus = obj.eventBus
      if (isObject(potentialBus)) {
        result = extendBusIfNeeded(potentialBus)
      }
    }
  }
  if (window && C.EVENT_BUS_NAMESPACE in window) {
    const potentialBus = window[C.EVENT_BUS_NAMESPACE]
    if (isObject(potentialBus)) {
      result ||= extendBusIfNeeded(potentialBus)
    }
  }
  return result
}
