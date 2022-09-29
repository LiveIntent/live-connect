import { isArray, isFunction, asStringParam } from '../utils/types'
import * as emitter from '../utils/emitter'
import { ICallHandler, IPixelSender, LiveConnectConfig, IStateWrapper } from '../types'

const DEFAULT_AJAX_TIMEOUT = 0

export function PixelSender (liveConnectConfig: LiveConnectConfig, calls: ICallHandler, onload: () => void, presend: () => void): IPixelSender {
  const url = (liveConnectConfig && liveConnectConfig.collectorUrl) || 'https://rp.liadm.com'

  function _sendAjax (state: IStateWrapper) {
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
   * @param {IStateWrapper} state
   * @private
   */
  function _sendPixel (state: IStateWrapper) {
    _sendState(state, 'p', uri => calls.pixelGet(uri, onload))
  }

  function _sendState (state: IStateWrapper, endpoint: string, makeCall: (url: string) => void) {
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
