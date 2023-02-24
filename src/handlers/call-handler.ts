import { EventBus, CallHandler } from 'live-connect-common'
import { WrappingContext } from '../utils/wrapping'

export class WrappedCallHandler implements CallHandler {
  private functions

  constructor (externalCallHandler: CallHandler, eventBus: EventBus) {
    const wrapper = new WrappingContext(externalCallHandler, 'CallHandler', eventBus)

    this.functions = {
      ajaxGet: wrapper.wrap('ajaxGet'),
      pixelGet: wrapper.wrap('pixelGet')
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
