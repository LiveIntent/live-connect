import { isArray, isFunction } from '../utils/types'
import * as emitter from '../utils/emitter'

const DEFAULT_AJAX_TIMEOUT = 5000
const MAX_ATTEMPTS = 3

/**
 * @param {LiveConnectConfiguration} liveConnectConfig
 * @param {CallHandler} calls
 * @param {function} onload
 * @param {function} presend
 * @returns {{sendAjax: *, sendPixel: *}}
 * @constructor
 */
export function PixelSender (liveConnectConfig, calls, onload, presend) {
  const url = (liveConnectConfig && liveConnectConfig.collectorUrl) || 'https://rp.liadm.com'

  /**
   * @param {StateWrapper} state
   * @param attempt
   * @private
   */
  function _sendAjax (state, attempt = 1) {
    _sendState(state.withAttempt(attempt), 'j', uri => {
      calls.ajaxGet(
        uri,
        bakersJson => {
          if (isFunction(onload)) onload()
          _callBakers(bakersJson)
        },
        e => {
          if (attempt < MAX_ATTEMPTS) {
            emitter.error('AjaxAttempt', `Attempt ${attempt}. ${e.message} `, e)
            _sendAjax(state, attempt + 1)
          } else {
            emitter.error('AjaxAttemptsExceeded', e.message, e)
          }
        },
        DEFAULT_AJAX_TIMEOUT
      )
    })
  }

  function _callBakers (bakersJson) {
    try {
      const bakers = JSON.parse(bakersJson).bakers
      if (isArray(bakers)) {
        for (let i = 0; i < bakers.length; i++) calls.pixelGet(`${bakers[i]}?dtstmp=${utcMillis()}`)
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
    _sendState(state, 'p', uri => calls.pixelGet(uri, onload))
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
