import E from './replayemitter'
import * as C from '../utils/consts'
import { isFunction } from '../utils/types'

/**
 * @param {number} size
 * @param {function} errorCallback
 * @return {ReplayEmitter}
 */
export function init (size, errorCallback) {
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
        const localBus = new E(size, globalBus)
        window[C.EVENT_BUS_NAMESPACE] = globalBus
        return localBus
      } else {
        if (isFunction(window[C.EVENT_BUS_NAMESPACE].hierarchical)) {
          const globalBus = window[C.EVENT_BUS_NAMESPACE]
          const localBus = new E(size, globalBus)
          return localBus
        } else {
          const globalBus = new E(size)
          const localBusOld = window[C.EVENT_BUS_NAMESPACE]
          const localBusNew = new E(size, globalBus)
          localBusOld.attachTo(globalBus)
          window[C.EVENT_BUS_NAMESPACE] = globalBus
          return localBusNew
        }
      }
    }
    return window[C.EVENT_BUS_NAMESPACE]
  } catch (e) {
    console.error('events.bus.init', e)
    errorCallback(e)
  }
}
