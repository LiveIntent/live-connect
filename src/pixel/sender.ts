import { isArray, isFunction } from 'live-connect-common'
import { EventBus } from '../types.js'
import { StateWrapper } from './state.js'
import { WrappedCallHandler } from '../handlers/call-handler.js'

export type PixelSenderOpts = {
  collectorUrl?: string,
  ajaxTimeout?: number
  callHandler: WrappedCallHandler,
  eventBus: EventBus,
  ajaxRetries?: number
}

const DEFAULT_AJAX_TIMEOUT = 0
const DEFAULT_AJAX_RETRIES = 3

export class PixelSender {
  url: string
  timeout: number
  calls: WrappedCallHandler
  eventBus: EventBus
  retries: number

  constructor (opts: PixelSenderOpts) {
    this.url = opts.collectorUrl ?? 'https://rp.liadm.com'
    this.timeout = opts.ajaxTimeout ?? DEFAULT_AJAX_TIMEOUT
    this.calls = opts.callHandler
    this.eventBus = opts.eventBus
    this.retries = opts.ajaxRetries ?? DEFAULT_AJAX_RETRIES
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

      const query = state.asQuery().add('dtstmp', Date.now(), { prepend: true }).toQueryString()
      const uri = `${this.url}/${endpoint}${query}`

      makeCall(uri)
    }
  }

  sendAjax(state: StateWrapper, opts: { onPreSend?: () => void, onLoad?: () => void } = {}): void {
    this.sendState(state, 'j', uri => {
      const go = (remainingRetries: number) => {
        // additionally set headers extracted from the state only if the state is not empty
        const headers = state.asHeaders()

        this.calls.ajaxGet(
          uri,
          bakersJson => {
            if (opts.onLoad && isFunction(opts.onLoad)) opts.onLoad()
            this.callBakers(bakersJson)
          },
          (e) => {
            if (remainingRetries <= 0) {
              this.sendPixel(state, opts)
              this.eventBus.emitError('AjaxFailed', e)
            } else {
              go(remainingRetries - 1)
            }
          },
          this.timeout,
          headers
        )
      }

      go(this.retries)
    }, opts.onPreSend)
  }

  sendPixel(state: StateWrapper, opts: { onPreSend?: () => void, onLoad?: () => void } = {}): void {
    this.sendState(state, 'p', uri => this.calls.pixelGet(uri, opts.onLoad), opts.onPreSend)
  }
}
