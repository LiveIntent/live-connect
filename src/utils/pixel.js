import { isFunction } from './types'

/**
 * Send a Get request via a pixel call
 * @param uri the pixel uri
 * @param onload a function that is executed if the image is successfully loaded
 */
export function sendPixel (uri, onload) {
  const img = new window.Image()
  if (isFunction(onload)) {
    img.onload = onload
  }
  img.src = uri
}
