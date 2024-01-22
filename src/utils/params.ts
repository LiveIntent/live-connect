import { isNonEmpty, isObject, isArray, isFunction } from 'live-connect-common'
import { md5 } from 'tiny-hashes/dist'

export function asParamOrEmpty<A>(param: string, value: A, transform: (a: NonNullable<A>) => string): [string, string][] {
  return isNonEmpty(value) ? [[param, transform(value)]] : []
}

export function asStringParam(param: string, value: string | number | boolean | null | undefined): [string, string][] {
  return asParamOrEmpty(param, value, (s) => encodeURIComponent(s))
}

export function asStringParamTransform<A>(param: string, value: A, transform: (a: NonNullable<A>) => string | number | boolean): [string, string][] {
  return asParamOrEmpty(param, value, (s) => encodeURIComponent(transform(s)))
}

export function asStringParamWhen<A extends string | number | boolean | null | undefined>(param: string, value: A, predicate: (s: NonNullable<A>) => boolean): [string, string][] {
  return (isNonEmpty(value) && isFunction(predicate) && predicate(value)) ? [[param, encodeURIComponent(value)]] : []
}

export function mapAsParams(paramsMap: Record<string, string | string[]>): [string, string][] {
  if (paramsMap && isObject(paramsMap)) {
    const array: [string, string][] = []
    Object.keys(paramsMap).forEach((key) => {
      const value = paramsMap[key]
      if (value && !isObject(value) && value.length) {
        if (isArray(value)) {
          (value as string[]).forEach(entry => array.push([encodeURIComponent(key), encodeURIComponent(entry)]))
        } else {
          array.push([encodeURIComponent(key), encodeURIComponent(value as string)])
        }
      }
    })
    return array
  } else {
    return []
  }
}

export function encodeIdCookieParam(value: string | undefined | null): [string, string][] {
  if (value !== null && value !== undefined) {
    return asStringParam('ic', md5(value))
  } else if (value === null) {
    return [['ic', '']]
  } else {
    return []
  }
}
