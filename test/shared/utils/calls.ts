import { ExternalCallHandler } from '../../../src/types'
import { isFunction } from '../../../src/utils/types'

export const TestCallHandler: ExternalCallHandler = {
  ajaxGet (url: string, responseHandler: (responseText: string, response: any) => void, fallback?: (error: any) => void, timeout = 1000): void {
    function errorCallback (name: string, message: string, error: any, request: XMLHttpRequest | XDomainRequest) {
      console.error('Error while executing ajax call', message, error, request)
      if (isFunction(fallback)) fallback(error)
    }

    function xhrCall (): XMLHttpRequest {
      const xhr = new XMLHttpRequest()
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          const status = xhr.status
          if ((status >= 200 && status < 300) || status === 304) {
            responseHandler(xhr.responseText, xhr)
          } else {
            const error = new Error(`Incorrect status received : ${status}`)
            errorCallback('XHRError', `Error during XHR call: ${status}, url: ${url}`, error, xhr)
          }
        }
      }
      return xhr
    }

    function xdrCall (): XDomainRequest {
      const xdr = new (window.XDomainRequest as any)()
      xdr.onprogress = () => undefined
      xdr.onerror = () => {
        const error = new Error(`XDR Error received: ${xdr.responseText}`)
        errorCallback('XDRError', `Error during XDR call: ${xdr.responseText}, url: ${url}`, error, xdr)
      }
      xdr.onload = () => responseHandler(xdr.responseText, xdr)
      return xdr
    }

    try {
      const request = (window && window.XDomainRequest) ? xdrCall() : xhrCall()
      request.ontimeout = () => {
        const error = new Error(`Timeout after ${timeout}, url : ${url}`)
        errorCallback('AjaxTimeout', `Timeout after ${timeout}`, error, request)
      }
      request.open('GET', url, true)
      request.timeout = timeout
      request.withCredentials = true
      request.send()
    } catch (error) {
      errorCallback('AjaxCompositionError', `Error while constructing ajax request, ${error}`, error, undefined)
    }
  },

  pixelGet (uri: string, onload?: () => void): void {
    const img = new window.Image()
    if (isFunction(onload)) {
      img.onload = onload
    }
    img.src = uri
  }
}
