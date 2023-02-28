import { isFunction } from 'live-connect-common'

export function sendPixel(uri: string, onload: () => void): void {
  const img = new window.Image()
  if (isFunction(onload)) {
    img.onload = onload
  }
  img.src = uri
}
