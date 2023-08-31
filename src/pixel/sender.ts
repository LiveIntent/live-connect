import { isArray, isFunction } from 'live-connect-common'
import { asStringParam } from '../utils/params'
import { LiveConnectConfig, EventBus } from '../types'
import { StateWrapper } from './state'
import { WrappedCallHandler } from '../handlers/call-handler'

const DEFAULT_AJAX_TIMEOUT = 0

export class PixelSender {
  url: string
  timeout: number
  calls: WrappedCallHandler
  eventBus: EventBus
  onload?: () => void
  presend?: () => void

  constructor (liveConnectConfig: LiveConnectConfig, calls: WrappedCallHandler, eventBus: EventBus, onload?: () => void, presend?: () => void) {
    this.url = (liveConnectConfig && liveConnectConfig.collectorUrl) || 'https://rp.liadm.com'
    this.timeout = (liveConnectConfig && liveConnectConfig.ajaxTimeout) || DEFAULT_AJAX_TIMEOUT
    this.calls = calls
    this.eventBus = eventBus
    this.onload = onload
    this.presend = presend
  }

  private callBakers(bakersJson: string): void {
    try {
      const bakers = JSON.parse(bakersJson).bakers
      if (isArray(bakers)) {
        for (let i = 0; i < bakers.length; i++) this.calls.pixelGet(`${bakers[i]}?dtstmp=${Date.now()}`)
      }
    } catch (e) {
      this.eventBus.emitErrorWithMessage('CallBakers', `Error while calling bakers with ${bakersJson}`, e)
    }
  }

  private sendState(state: StateWrapper, endpoint: string, makeCall: (url: string) => void): void {
    if (state.sendsPixel()) {
      if (isFunction(this.presend)) {
        this.presend()
      }

      const dtstmpTuple = asStringParam('dtstmp', Date.now())
      const query = state.asQuery().prependParams(...dtstmpTuple)
      const queryString = query.toQueryString()
      const uri = `${this.url}/${endpoint}${queryString}`

      makeCall(uri)
    }
  }

  sendAjax(state: StateWrapper): void {
    this.sendState(state, 'j', uri => {
      this.calls.ajaxGet(
        uri,
        bakersJson => {
          if (isFunction(this.onload)) this.onload()
          this.callBakers(bakersJson)
        },
        (e) => {
          this.sendPixel(state)
          this.eventBus.emitError('AjaxFailed', e)
        },
        this.timeout
      )
    })
  }

  sendPixel(state: StateWrapper): void {
    this.sendState(state, 'p', uri => this.calls.pixelGet(uri, this.onload))
  }
}
