/**
 * @param {LiveConnectConfiguration} liveConnectConfig
 * @param {function} onload
 * @returns {{send: *}}
 * @constructor
 */
import { isFunction } from '../utils/types'
import * as emitter from '../utils/emitter'

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
      const fullUrl = `${url}/p${queryString}${withDt}`
      if (isFunction(onload)) {
        img.onload = onload
      }
      if (!state.isError()) {
        img.onerror = function () {
          const e = new Error()
          emitter.error('PixelSenderError', `Error sending pixel ${fullUrl}`, e)
        }
      }
      img.src = fullUrl
    }
  }

  return {
    send: _send
  }
}
