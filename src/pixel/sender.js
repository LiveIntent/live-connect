/**
 * @param {LiveConnectConfiguration} liveConnectConfig
 * @param {function} onload
 * @returns {{send: *}}
 * @constructor
 */
import { isFunction } from '../utils/types'

export function PixelSender (liveConnectConfig, onload, presend) {
  const url = (liveConnectConfig && liveConnectConfig.collectorUrl) || 'https://rp.liadm.com'

  /**
   * @param {StateWrapper} state
   * @private
   */
  function _send (state) {
    if (state.sendsPixel()) {
      if (isFunction(presend)) {
        presend()
      }
      const img = new window.Image()
      const now = new Date()
      const utcMillis = new Date(now.toUTCString()).getTime() + now.getMilliseconds()
      const latest = `dtstmp=${utcMillis}`
      const queryString = state.asQueryString()
      const withDt = queryString ? `&${latest}` : `?${latest}`
      img.src = `${url}/p${queryString}${withDt}`
      if (isFunction(onload)) {
        img.onload = onload
      }
    }
  }

  return {
    send: _send
  }
}
