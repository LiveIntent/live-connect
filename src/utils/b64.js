import { btoa as btoaFromLib } from 'abab'
import { isFunction } from './types'

/**
 * @param {string} s
 * @returns {string}
 * @private
 */
function _safeBtoa (s) {
  const res = btoaFromLib(s)
  return res || ''
}

/**
 * @type {RegExp}
 * @private
 */
const _base64encodeRegex = /[+/]|=+$/g
/**
 * @type {{'+': string, '/': string}}
 * @private
 */
const _base64ToUrlEncodedChars = {
  '+': '-',
  '/': '_'
}

/**
 * @param {char} x
 * @returns {*|string}
 * @private
 */
function _replaceBase64Chars (x) {
  return _base64ToUrlEncodedChars[x] || ''
}

/**
 * @param {string} s
 * @returns {*}
 */
export function base64UrlEncode (s) {
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
