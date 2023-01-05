import { btoa as btoaFromLib } from './btoa'
import { isFunction } from './types'

function _safeBtoa (s: string): string {
  const res = btoaFromLib(s)
  return res || ''
}

const _base64encodeRegex = /[+/]|=+$/g

const _base64ToUrlEncodedChars: Record<string, string> = {
  '+': '-',
  '/': '_'
}

function _replaceBase64Chars (x: string): string {
  return _base64ToUrlEncodedChars[x] || ''
}

export function base64UrlEncode (s: string): string {
  let btoa = null
  // First we escape the string using encodeURIComponent to get the UTF-8 encoding of the characters,
  // then we convert the percent encodings into raw bytes, and finally feed it to btoa() function.
  const utf8Bytes = encodeURIComponent(s).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1))
  try {
    btoa = (window && isFunction(window.btoa)) ? window.btoa : _safeBtoa
  } catch (e) {
    btoa = _safeBtoa
  }
  return btoa(utf8Bytes).replace(_base64encodeRegex, _replaceBase64Chars)
}
