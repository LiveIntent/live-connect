import { EventBus, ExternalCallHandler } from '../types'
import { WrappingContext } from '../utils/wrapping'

interface WrappedExternalCallHandler {
  ajaxGet: (
    url: string,
    onSuccess: (responseText: string, response: unknown) => void,
    onError?: (error: unknown) => void,
    timeout?: number
  ) => void
  pixelGet: (
    url: string,
    onLoad?: () => void
  ) => void
}

export class CallHandler {
  private functions: WrappedExternalCallHandler

  constructor (externalCallHandler: ExternalCallHandler, eventBus: EventBus) {
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
