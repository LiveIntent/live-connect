export const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const uuidRegex = new RegExp(`^${UUID}$`, 'i')

export function safeToString (value: any): string {
  return typeof value === 'object' ? JSON.stringify(value) : ('' + value)
}

/**
 * Checks whether the param NOT `null` and NOT `undefined`
 * @param {*} value
 * @returns {boolean}
 */
export function isNonEmpty (value: any): boolean {
  return typeof value !== 'undefined' && value !== null && trim(value).length > 0
}

export function isUUID (value: string): boolean {
  return value && uuidRegex.test(trim(value))
}

/**
 * @param {*} arr
 * @returns {boolean}
 */
export function isArray (arr: any): boolean {
  return Object.prototype.toString.call(arr) === '[object Array]'
}

const hasTrim = !!String.prototype.trim

export function trim (value: string): string {
  return hasTrim ? ('' + value).trim() : ('' + value).replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')
}

export function isString (str: any): boolean {
  return typeof str === 'string'
}

export function strEqualsIgnoreCase (fistStr: string, secondStr: string): boolean {
  return isString(fistStr) && isString(secondStr) && trim(fistStr.toLowerCase()) === trim(secondStr.toLowerCase())
}

export function isObject (obj: any): boolean {
  return !!obj && typeof obj === 'object' && !isArray(obj)
}

export function isFunction (fun: Function): boolean {
  return fun && typeof fun === 'function'
}

/**
 * Returns the string representation when something should expire
 * @param millis
 * @return {Date}
 */
export function expiresInDays (millis: number): Date {
  return _expiresInMillis(millis * 864e5)
}

/**
 * Returns the string representation when something should expire
 * @param millis
 * @return {Date}
 */
export function expiresInHours (millis: number): Date {
  return _expiresInMillis(millis * 36e5)
}

function _expiresInMillis (millis: number): Date {
  return new Date((new Date().getTime() + millis))
}

export function asParamOrEmptyTransform <A> (param: string, value: A, transform: (str: A) => string): [string, string] | [] {
  return isNonEmpty(value) ? ([param, transform(value)]) : []
}

export function asParamOrEmpty (param: string, value: string | undefined, transform?: (str: string) => string): [string, string] | [] {
  return asParamOrEmptyTransform(param, value, isFunction(transform) ? transform : (x: string) => x)
}

export function asStringParam (param: string, value: string | number | boolean): [string, string] | [] {
  return asParamOrEmptyTransform(param, value, (s) => encodeURIComponent(s))
}

export function asStringParamTransform <A> (param: string, value: A, transform: (str: A) => string | number | boolean): [string, string] | [] {
  return asParamOrEmptyTransform(param, value, (s) => encodeURIComponent(transform(s)))
}

export function asStringParamWhen (param: string, value: string, predicate: (str: string) => boolean): [string, string] | [] {
  return (isNonEmpty(value) && isFunction(predicate) && predicate(value)) ? [param, encodeURIComponent(value)] : []
}

export function mapAsParams (paramsMap: Record<string, string | string[]>): [string, string][] {
  if (paramsMap && isObject(paramsMap)) {
    const array = []
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

export function merge (obj1: object, obj2: object): object {
  const res = {}
  const clean = (obj) => isObject(obj) ? obj : {}
  const first = clean(obj1)
  const second = clean(obj2)
  Object.keys(first).forEach(function (key) {
    res[key] = first[key]
  })
  Object.keys(second).forEach(function (key) {
    res[key] = second[key]
  })
  return res
}
