import { isFunction } from './types'

export function sendPixel(uri: string, onload: () => void): void {
  const img = new window.Image()
  if (isFunction(onload)) {
    img.onload = onload
  }
  img.src = uri
}
