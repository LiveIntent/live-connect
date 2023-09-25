import { isArray, isFunction } from 'live-connect-common'
import { asStringParam } from '../utils/params'
import { EventBus } from '../types'
import { StateWrapper } from './state'
import { WrappedCallHandler } from '../handlers/call-handler'

export type PixelSenderOpts = {
  collectorUrl?: string,
  ajaxTimeout?: number
  callHandler: WrappedCallHandler,
  eventBus: EventBus
}

const DEFAULT_AJAX_TIMEOUT = 0

export class PixelSender {
  url: string
  timeout: number
  calls: WrappedCallHandler
  eventBus: EventBus

  constructor (opts: PixelSenderOpts) {
    this.url = opts.collectorUrl || 'https://rp.liadm.com'
    this.timeout = opts.ajaxTimeout || DEFAULT_AJAX_TIMEOUT
    this.calls = opts.callHandler
    this.eventBus = opts.eventBus
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

  private sendState(
    state: StateWrapper,
    endpoint: string,
    makeCall: (url: string) => void,
    onPreSend?: () => void
  ): void {
    if (state.sendsPixel()) {
      if (onPreSend && isFunction(onPreSend)) {
        onPreSend()
      }

      const dtstmpTuple = asStringParam('dtstmp', Date.now())
      const query = state.asQuery().prependParams(...dtstmpTuple)
      const queryString = query.toQueryString()
      const uri = `${this.url}/${endpoint}${queryString}`

      makeCall(uri)
    }
  }

  sendAjax(state: StateWrapper, opts: { onPreSend?: () => void, onLoad?: () => void } = {}): void {
    this.sendState(state, 'j', uri => {
      this.calls.ajaxGet(
        uri,
        bakersJson => {
          if (opts.onLoad && isFunction(opts.onLoad)) opts.onLoad()
          this.callBakers(bakersJson)
        },
        (e) => {
          this.sendPixel(state, opts)
          this.eventBus.emitError('AjaxFailed', e)
        },
        this.timeout
      )
    }, opts.onPreSend)
  }

  sendPixel(state: StateWrapper, opts: { onPreSend?: () => void, onLoad?: () => void } = {}): void {
    this.sendState(state, 'p', uri => this.calls.pixelGet(uri, opts.onLoad), opts.onPreSend)
  }
}
