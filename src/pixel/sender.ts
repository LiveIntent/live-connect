import { LiveConnectConfig } from './../types'
import { isArray, isFunction, asStringParam } from '../utils/types'
import * as emitter from '../utils/emitter'
import { CallHandler } from '../handlers/call-handler'
import { StateWrapper } from './state'

const DEFAULT_AJAX_TIMEOUT = 0

export class PixelSender {
  url: string
  calls: CallHandler
  onload?: () => void
  presend?: () => void

  // TODO: liveConnectConfig
  constructor (liveConnectConfig: LiveConnectConfig, calls: CallHandler, onload?: () => void, presend?: () => void) {
    this.url = (liveConnectConfig && liveConnectConfig.collectorUrl) || 'https://rp.liadm.com'
    this.calls = calls
    this.onload = onload
    this.presend = presend
  }

  sendAjax (state: StateWrapper) {
    this._sendState(state, 'j', uri => {
      this.calls.ajaxGet(
        uri,
        bakersJson => {
          if (isFunction(this.onload)) this.onload()
          this._callBakers(bakersJson)
        },
        (e) => {
          this.sendPixel(state)
          emitter.error('AjaxFailed', e.message, e)
        },
        DEFAULT_AJAX_TIMEOUT
      )
    })
  }

  sendPixel (state: StateWrapper) {
    this._sendState(state, 'p', uri => this.calls.pixelGet(uri, this.onload))
  }

  _callBakers (bakersJson: string) {
    try {
      const bakers = JSON.parse(bakersJson).bakers
      if (isArray(bakers)) {
        for (let i = 0; i < bakers.length; i++) this.calls.pixelGet(`${bakers[i]}?dtstmp=${utcMillis()}`)
      }
    } catch (e) {
      emitter.error('CallBakers', 'Error while calling bakers', e)
    }
  }

  _sendState (state: StateWrapper, endpoint: string, makeCall: (url: string) => void) {
    if (state.sendsPixel()) {
      if (isFunction(this.presend)) {
        this.presend()
      }

      const dtstmpTuple = (asStringParam('dtstmp', utcMillis()) as [string, string])
      const query = state.asQuery().prependParam(dtstmpTuple)
      const queryString = query.toQueryString()
      const uri = `${this.url}/${endpoint}${queryString}`

      makeCall(uri)
    }
  }
}

function utcMillis () {
  const now = new Date()
  return new Date(now.toUTCString()).getTime() + now.getMilliseconds()
}
