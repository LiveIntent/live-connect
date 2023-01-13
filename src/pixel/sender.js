import { isArray, isFunction, asStringParam } from '../utils/types'

const DEFAULT_AJAX_TIMEOUT = 3000

/**
 * @param {LiveConnectConfiguration} liveConnectConfig
 * @param {CallHandler} calls
 * @param {EventBus} eventBus
 * @param {function} onload
 * @param {function} presend
 * @returns {{sendAjax: *, sendPixel: *}}
 * @constructor
 */
export function PixelSender (liveConnectConfig, calls, eventBus, onload, presend) {
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
          eventBus.emitError('AjaxFailed', e)
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
      eventBus.emitErrorWithMessage('CallBakers', `Error while calling bakers with ${bakersJson} for the url: ${url}`, e)
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
