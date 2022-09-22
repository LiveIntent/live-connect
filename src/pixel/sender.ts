import { isArray, isFunction, asStringParam } from '../utils/types'
import * as emitter from '../utils/emitter'

const DEFAULT_AJAX_TIMEOUT = 0

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
   * @private
   */
  function _sendAjax (state) {
    _sendState(state, 'j', uri => {
      calls.ajaxGet(
        uri,
        bakersJson => {
          if (isFunction(onload)) onload()
          _callBakers(bakersJson)
        },
        (e) => {
          _sendPixel(state)
          emitter.error('AjaxFailed', e.message, e)
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

      const dtstmpTuple = asStringParam('dtstmp', utcMillis())
      const query = state.asQuery().prependParam(dtstmpTuple)
      const queryString = query.toQueryString()
      const uri = `${url}/${endpoint}${queryString}`

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
