import E from './replayemitter'
import * as C from '../utils/consts'

export function local (size) {
  return new E(size)
}

/**
 * @param {number} size
 * @param {function} errorCallback
 * @return {ReplayEmitter}
 */
export function init (size, errorCallback, bus) {
  if (!size) {
    size = 5
  }
  try {
    console.log('events.bus.init')
    if (!window) {
      errorCallback(new Error('Bus can only be attached to the window, which is not present'))
    } else {
      if (!window[C.EVENT_BUS_NAMESPACE]) {
        const globalBus = new E(size)
        const localBus = bus || new E(size)
        localBus.setGlobal(globalBus)
        globalBus.setCurrent(localBus)
        window[C.EVENT_BUS_NAMESPACE] = globalBus
        return localBus
      } else {
        if (isFunction(window[C.EVENT_BUS_NAMESPACE].hierarchical)) {
          const globalBus = window[C.EVENT_BUS_NAMESPACE]
          const localBus = bus || new E(size)
          localBus.setGlobal(globalBus)
          globalBus.setCurrent(localBus)
          return localBus
        } else {
          const globalBus = new E(size)
          const localBusOld = window[C.EVENT_BUS_NAMESPACE]
          const localBusNew = bus || new E(size)
          localBusOld.setGlobal(globalBus)
          localBusNew.setGlobal(globalBus)
          globalBus.setCurrent(localBusNew)
          window[C.EVENT_BUS_NAMESPACE] = globalBus
          return localBusNew
        }
      }
    }
  } catch (e) {
    console.error('events.bus.init', e)
    errorCallback(e)
  }
}
