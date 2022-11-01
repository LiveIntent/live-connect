import { isFunction } from '../../../src/utils/types'

/**
 * @param url
 * @param responseHandler
 * @param fallback
 * @param timeout
 */
export function ajaxGet (url, responseHandler, fallback = () => {}, timeout = 1000) {
  function errorCallback (name, message, error, request) {
    console.error('Error while executing ajax call', error, request)
    fallback(error)
  }

  function xhrCall () {
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

  function xdrCall () {
    const xdr = new window.XDomainRequest()
    xdr.onprogress = () => {}
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
}

/**
 * Send a Get request via a pixel call
 * @param uri the pixel uri
 * @param onload a function that is executed if the image is successfully loaded
 */
export function pixelGet (uri, onload) {
  const img = new window.Image()
  if (isFunction(onload)) {
    img.onload = onload
  }
  img.src = uri
}
