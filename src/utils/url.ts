import { isArray } from './types'

type ParsedParam = number | boolean | string | null | undefined

export const toParams = (tuples: ([string, string][])) => {
  let acc = ''
  tuples.forEach((tuple) => {
    const operator = acc.length === 0 ? '?' : '&'
    if (tuple && tuple.length && tuple.length === 2 && tuple[0] && tuple[1]) {
      acc = `${acc}${operator}${tuple[0]}=${tuple[1]}`
    }
  })
  return acc
}

function _isNum (v: any): number | any {
  return isNaN(+v) ? v : +v
}

function _isNull (v: any): null | any {
  return v === 'null' || v === 'undefined' ? null : v
}

function _isBoolean (v: any): boolean | any {
  return v === 'false' ? false : (v === 'true' ? true : v)
}

function _convert (v: any): boolean {
  return _isBoolean(_isNull(_isNum(v)))
}

function _parseParam (params: Record<string, string | string[]>, key: string): ParsedParam | ParsedParam[] {
  if (params[key]) {
    if (isArray(params[key])) {
      return (params[key] as string[]).map(v => _convert(decodeValue(v)))
    } else {
      return _convert(decodeValue(params[key] as string))
    }
  }
}

function _allParams (url: string): Record<string, string | string[]> {
  let questionMarkIndex, queryParams, historyIndex
  const obj = {}
  if (!url || (questionMarkIndex = url.indexOf('?')) === -1 || !(queryParams = url.slice(questionMarkIndex + 1))) {
    return obj
  }
  if ((historyIndex = queryParams.indexOf('#')) !== -1 && !(queryParams = queryParams.slice(0, historyIndex))) {
    return obj
  }
  queryParams.split('&').forEach(function (query) {
    if (query) {
      query = ((query = query.split('=')) && query.length === 2 ? query : [query[0], 'true'])
      if (query[0].slice(-2) === '[]') obj[query[0] = query[0].slice(0, -2)] = obj[query[0]] || []
      if (!obj[query[0]]) return (obj[query[0]] = query[1])
      isArray(obj[query[0]]) ? obj[query[0]].push(query[1]) : (obj[query[0]] = [obj[query[0]], query[1]])
    }
  })
  return obj
}

export function decodeValue (v: string): string {
  return v.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent)
}

export function urlParams (url: string): Record<string, ParsedParam | ParsedParam[]> {
  const params = _allParams(url)
  let result = {}
  Object.keys(params).forEach((k) => result[k] = _parseParam(params, k))
  return result
}

export function getQueryParameter (url: string, name: string): ParsedParam | ParsedParam[] {
  const params = _allParams(url)
  return _parseParam(params, name)
}
