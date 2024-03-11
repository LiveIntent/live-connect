import { EventBus, CallHandler } from 'live-connect-common'
import { Wrapped, WrappingContext } from '../utils/wrapping.js'

const empty = () => undefined

function privacyCheck<K extends keyof CallHandler>(wrapper: WrappingContext<CallHandler>, privacyMode: boolean, functionName: K): Wrapped<CallHandler[K]> {
  return (privacyMode) ? empty : wrapper.wrap(functionName)
}

export class WrappedCallHandler implements CallHandler {
  private functions: {
    ajaxGet: Wrapped<CallHandler['ajaxGet']>,
    pixelGet: Wrapped<CallHandler['pixelGet']>
  }

  constructor (externalCallHandler: CallHandler, eventBus: EventBus, privacyMode: boolean) {
    const wrapper = new WrappingContext(externalCallHandler, 'CallHandler', eventBus)

    this.functions = {
      ajaxGet: privacyCheck(wrapper, privacyMode, 'ajaxGet'),
      pixelGet: privacyCheck(wrapper, privacyMode, 'pixelGet')
    }

    wrapper.reportErrors()
  }

  ajaxGet(
    url: string,
    onSuccess: (responseText: string, response: unknown) => void,
    onError?: (error: unknown) => void,
    timeout?: number
  ): void {
    this.functions.ajaxGet(url, onSuccess, onError, timeout)
  }

  pixelGet(
    url: string,
    onLoad?: () => void
  ): void {
    this.functions.pixelGet(url, onLoad)
  }
}
