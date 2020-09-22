/**
 * @param {LiveConnectConfiguration} liveConnectConfig
 * @param {function} onload
 * @returns {{send: *}}
 * @constructor
 */
import { get } from '../utils/ajax'
import { isArray, isFunction } from '../utils/types'
import { sendPixel } from '../utils/pixel'
import { safeParseJson } from '../utils/json'

export function PixelSender (liveConnectConfig, onload, presend) {
  const url = (liveConnectConfig && liveConnectConfig.collectorUrl) || 'https://rp.liadm.com'

  /**
   * @param {StateWrapper} state
   * @private
   */
  function _sendAjax (state) {
    _sendState(state, 'j', uri => {
      get(uri, responseBody => {
        if (isFunction(onload)) onload()
        const bakers = safeParseJson(responseBody).bakers
        if (isArray(bakers)) {
          for (let i = 0; i < bakers.length; i++) sendPixel(`${bakers[i]}?dtstmp=${utcMillis()}`)
        }
      })
    })
  }

  /**
   * @param {StateWrapper} state
   * @private
   */
  function _sendPixel (state) {
    _sendState(state, 'p', uri => {
      sendPixel(uri, onload)
    })
  }

  function _sendState (state, endpoint, makeCall) {
    if (state.sendsPixel()) {
      if (isFunction(presend)) {
        presend()
      }

      const latest = `dtstmp=${utcMillis()}`
      const queryString = state.asQueryString()
      const withDt = queryString ? `&${latest}` : `?${latest}`
      const uri = `${url}/${endpoint}${queryString}${withDt}`

      makeCall(uri)
    }
  }

  function utcMillis () {
    const now = new Date()
    return new Date(now.toUTCString()).getTime() + now.getMilliseconds()
  }

  return {
    sendAjax: _sendAjax,
    sendPixel: _sendPixel
  }
}
