export const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

const uuidRegex = new RegExp(`^${UUID}$`, 'i')

export function safeToString (value: unknown): string {
  return typeof value === 'object' ? JSON.stringify(value) : ('' + value)
}

export function nonNull <A> (value: A): value is NonNullable<A> {
  return value != null
}

export function isNonEmpty <A> (value: A): value is NonNullable<A> {
  return nonNull(value) && trim(value).length > 0
}

export function isUUID (value: unknown): value is string {
  return !!value && uuidRegex.test(trim(value))
}

export function isArray (arr: unknown): arr is unknown[] {
  return Object.prototype.toString.call(arr) === '[object Array]'
}

const hasTrim = !!String.prototype.trim

export function trim (value: any): string {
  return hasTrim ? ('' + value).trim() : ('' + value).replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')
}

export function isString (str: unknown): str is string {
  return typeof str === 'string'
}

export function strEqualsIgnoreCase (fistStr: string, secondStr: string): boolean {
  return isString(fistStr) && isString(secondStr) && trim(fistStr.toLowerCase()) === trim(secondStr.toLowerCase())
}

export function isObject (obj: unknown): obj is object {
  return !!obj && typeof obj === 'object' && !isArray(obj)
}

export function isFunction (fun: unknown): fun is CallableFunction {
  return !!fun && typeof fun === 'function'
}

export function expiresInDays (expires: number): Date {
  return _expiresIn(expires, 864e5)
}

function _expiresIn (expires: number, number: number): Date {
  return new Date((new Date().getTime() + (expires * number)))
}

export function expiresInHours (expires: number): Date {
  return _expiresIn(expires, 36e5)
}

export function asParamOrEmpty <A> (param: string, value: A, transform: (a: NonNullable<A>) => string): [string, string][] {
  return isNonEmpty(value) ? [[param, transform(value)]] : []
}

export function asStringParam (param: string, value: string | number | boolean | null | undefined): [string, string][] {
  return asParamOrEmpty(param, value, (s) => encodeURIComponent(s))
}

export function asStringParamTransform <A> (param: string, value: A, transform: (a: NonNullable<A>) => string | number | boolean): [string, string][] {
  return asParamOrEmpty(param, value, (s) => encodeURIComponent(transform(s)))
}

export function asStringParamWhen<A extends string | number | boolean | null | undefined> (param: string, value: A, predicate: (s: NonNullable<A>) => boolean): [string, string][] {
  return (isNonEmpty(value) && isFunction(predicate) && predicate(value)) ? [[param, encodeURIComponent(value)]] : []
}

export function mapAsParams (paramsMap: Record<string, string | string[]>): [string, string][] {
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

export function merge <A extends object, B extends object> (obj1: A, obj2: B): A & B {
  const res = {} as A & B

  function clean <T> (obj: T): T | object {
    return isObject(obj) ? obj : {}
  }

  function keys <T extends object> (obj: T): (keyof T)[] {
    return Object.keys(obj) as (keyof T)[]
  }

  const first = clean(obj1)
  const second = clean(obj2)

  keys(first).forEach(key => {
    res[key] = first[key]
  })
  keys(second).forEach(key => {
    res[key] = second[key]
  })
  return res
}
