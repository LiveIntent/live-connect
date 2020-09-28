import { isArray, isFunction } from '../utils/types'
import { sendPixel } from '../utils/pixel'
import * as emitter from '../utils/emitter'

/**
 * @param {LiveConnectConfiguration} liveConnectConfig
 * @param {AjaxHandler} ajax
 * @param {function} onload
 * @param {function} presend
 * @returns {{sendAjax: *, sendPixel: *}}
 * @constructor
 */
export function PixelSender (liveConnectConfig, ajax, onload, presend) {
  const url = (liveConnectConfig && liveConnectConfig.collectorUrl) || 'https://rp.liadm.com'

  /**
   * @param {StateWrapper} state
   * @private
   */
  function _sendAjax (state) {
    _sendState(state, 'j', uri => {
      ajax.get(uri, bakersJson => {
        if (isFunction(onload)) onload()
        _callBakers(bakersJson)
      })
    })
  }

  function _callBakers (bakersJson) {
    try {
      const bakers = JSON.parse(bakersJson).bakers
      if (isArray(bakers)) {
        for (let i = 0; i < bakers.length; i++) sendPixel(`${bakers[i]}?dtstmp=${utcMillis()}`)
      }
    } catch (e) {
      emitter.error('CallBakers', 'Error while calling bakers', e)
    }
  }

  /**
   * @param {StateWrapper} state
   * @private
   */
  function _sendPixel (state) {
    _sendState(state, 'p', uri => sendPixel(uri, onload))
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
