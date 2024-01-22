import { isArray } from 'live-connect-common'

export type ParsedParam = number | boolean | string | null | undefined

function _isNum(v: string): number | string {
  return isNaN(+v) ? v : +v
}

function _isNull<A>(v: A): null | A {
  return v === 'null' || v === 'undefined' ? null : v
}

function _isBoolean<A>(v: A): A | boolean {
  return v === 'false' ? false : (v === 'true' ? true : v)
}

function _convert(v: string): boolean | number | string | null {
  return _isBoolean(_isNull(_isNum(v)))
}

function _parseParam(params: Record<string, string | string[]>, key: string): ParsedParam | ParsedParam[] {
  if (key in params) {
    const value = params[key]
    if (isArray(value)) {
      return value.map(v => _convert(decodeValue(v)))
    } else {
      return _convert(decodeValue(value))
    }
  }
}

function _allParams(url: string): Record<string, string | string[]> {
  let questionMarkIndex, queryParams, historyIndex
  const obj: Record<string, string | string[]> = {}
  if (!url || (questionMarkIndex = url.indexOf('?')) === -1 || !(queryParams = url.slice(questionMarkIndex + 1))) {
    return obj
  }
  if ((historyIndex = queryParams.indexOf('#')) !== -1 && !(queryParams = queryParams.slice(0, historyIndex))) {
    return obj
  }
  queryParams.split('&').forEach(function (raw) {
    if (raw) {
      let key: string

      const split = raw.split('=')
      key = split[0]
      const value = split.length === 2 ? split[1] : 'true'

      if (key.slice(-2) === '[]') {
        key = key.slice(0, -2)
      }

      if (key in obj) {
        const previous = obj[key]
        if (isArray(previous)) {
          previous.push(value)
        } else {
          obj[key] = [previous, value]
        }
      } else {
        obj[key] = value
      }
    }
  })
  return obj
}

export function decodeValue(v: string): string {
  return v.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent)
}

export function urlParams(url: string): Record<string, ParsedParam | ParsedParam[]> {
  const params = _allParams(url)
  const result: Record<string, ParsedParam | ParsedParam[]> = {}
  Object.keys(params).forEach((k) => { result[k] = _parseParam(params, k) })
  return result
}

export function urlParamsArray(url: string): [string, ParsedParam | ParsedParam[]][] {
  const params = _allParams(url)
  const result: [string, ParsedParam | ParsedParam[]][] = []
  Object.keys(params).forEach((k) => { result.push([k, _parseParam(params, k)]) })
  return result
}

export function getQueryParameter(url: string, name: string): ParsedParam | ParsedParam[] {
  const params = _allParams(url)
  return _parseParam(params, name)
}

export class ParsedUrl {
  hash: string
  host: string
  hostname: string
  pathname: string
  port: string
  protocol: string
  search: string

  constructor (url: string) {
    // eslint-disable-next-line
    const urlRegExp = /^(https?\:\/\/)?(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/
    const match = url.match(urlRegExp)
    if (match === null) {
      throw new TypeError(`Failed to parse URL: ${url}`)
    } else {
      this.protocol = match[1] || ''
      this.host = match[2] || ''
      this.hostname = match[3] || ''
      this.port = match[4] || ''
      this.pathname = match[5] || ''
      this.search = match[6] || ''
      this.hash = match[7] || ''
    }
  }

  public toString(): string {
    return `${this.protocol}${this.host}${this.pathname}${this.search}${this.hash}`
  }
}
