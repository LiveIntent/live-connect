import { isArray, isFunction, asStringParam } from '../utils/types'
import { LiveConnectConfig, EventBus } from '../types'
import { StateWrapper } from './state'
import { CallHandler } from '../handlers/call-handler'

const DEFAULT_AJAX_TIMEOUT = 0

export class PixelSender {
  url: string
  calls: CallHandler
  eventBus: EventBus
  onload?: () => void
  presend?: () => void

  constructor (liveConnectConfig: LiveConnectConfig, calls: CallHandler, eventBus: EventBus, onload?: () => void, presend?: () => void) {
    this.url = (liveConnectConfig && liveConnectConfig.collectorUrl) || 'https://rp.liadm.com'
    this.calls = calls
    this.eventBus = eventBus
    this.onload = onload
    this.presend = presend
  }

  private callBakers(bakersJson: string): void {
    try {
      const bakers = JSON.parse(bakersJson).bakers
      if (isArray(bakers)) {
        for (let i = 0; i < bakers.length; i++) this.calls.pixelGet(`${bakers[i]}?dtstmp=${this.utcMillis()}`)
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

      const dtstmpTuple = asStringParam('dtstmp', this.utcMillis())
      const query = state.asQuery().prependParams(...dtstmpTuple)
      const queryString = query.toQueryString()
      const uri = `${this.url}/${endpoint}${queryString}`

      makeCall(uri)
    }
  }

  private utcMillis() {
    const now = new Date()
    return new Date(now.toUTCString()).getTime() + now.getMilliseconds()
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
        DEFAULT_AJAX_TIMEOUT
      )
    })
  }

  sendPixel(state: StateWrapper): void {
    this.sendState(state, 'p', uri => this.calls.pixelGet(uri, this.onload))
  }
}
