import E from './replayemitter'

/**
 * @param {number} size
 * @param {function} errorCallback
 * @return {ReplayEmitter}
 */
export function init (busName, size, errorCallback) {
  if (!size) {
    size = 5
  }

  try {
    console.log('events.bus.init')
    if (!window) {
      errorCallback(new Error('Bus can only be attached to the window, which is not present'))
    }
    if (window && !window[busName]) {
      window[busName] = new E(size)
    }
    return window[busName]
  } catch (e) {
    console.error('events.bus.init', e)
    errorCallback(e)
  }
}
