import { isArray } from './types'

export const toParams = (tuples) => {
  let acc = ''
  tuples.forEach((tuple) => {
    let operator = ''
    if (acc.length === 0) {
      operator = '?'
    } else {
      operator = '&'
    }
    if (tuple && tuple.length && tuple.length === 2 && tuple[0] && tuple[1]) {
      acc = `${acc}${operator}${tuple[0]}=${tuple[1]}`
    }
  })
  return acc
}

function _decode (s) {
  return s.indexOf('%') === -1 ? s : decodeURIComponent(s)
}

function _isNum (v) {
  return isNaN(+v) ? v : +v
}

function _isNull (v) {
  return v === 'null' || v === 'undefined' ? null : v
}

function _isBoolean (v) {
  return v === 'false' ? false : (v === 'true' ? true : v)
}

function _convert (v) {
  return _isBoolean(_isNull(_isNum(v)))
}

export function urlParams (url) {
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
      query = ((query = query.split('=')) && query.length === 2 ? query : [query[0], 'true']).map(_decode)
      if (query[0].slice(-2) === '[]') obj[query[0] = query[0].slice(0, -2)] = obj[query[0]] || []
      if (!obj[query[0]]) return (obj[query[0]] = _convert(query[1]))
      if (isArray(obj[query[0]])) {
        obj[query[0]].push(_convert(query[1]))
      } else {
        obj[query[0]] = [obj[query[0]], _convert(query[1])]
      }
    }
  })
  return obj
}
