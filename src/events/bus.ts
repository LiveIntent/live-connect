import E from './replayemitter'
import * as C from '../utils/consts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function init (size?: number | string, errorCallback?: (error: any) => void): E {
  if (!size) {
    size = 5
  }
  try {
    console.log('events.bus.init')

    if (!errorCallback) {
      errorCallback = () => { return undefined }
    }

    if (!window) {
      errorCallback(new Error('Bus can only be attached to the window, which is not present'))
    }
    if (window && !window[C.EVENT_BUS_NAMESPACE]) {
      window[C.EVENT_BUS_NAMESPACE] = new E(size)
    }
    return window[C.EVENT_BUS_NAMESPACE]
  } catch (e) {
    console.error('events.bus.init', e)
    errorCallback(e)
  }
}
