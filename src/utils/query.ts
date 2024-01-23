import { isArray, nonNull, onNonNull } from 'live-connect-common'
import { md5 } from 'tiny-hashes/dist'

export type ParamValue = string | number | boolean
export type ParamOptions = {
  stripEmpty?: boolean
  prepend?: boolean
}

export class QueryBuilder {
  tuples: [string, ParamValue][]

  constructor (tuples: [string, ParamValue][] = []) {
    this.tuples = tuples
  }

  add(key: string, value: ParamValue, options: ParamOptions = {}): QueryBuilder {
    const { stripEmpty = true, prepend = false } = options

    if (key === '') {
      return this
    } else if (stripEmpty && value === '') {
      return this
    } else if (prepend) {
      this.tuples.unshift([key, value])
      return this
    } else {
      this.tuples.push([key, value])
      return this
    }
  }

  addOptional(key: string, value: ParamValue | null | undefined, options: ParamOptions = {}): QueryBuilder {
    if (nonNull(value)) {
      return this.add(key, value, options)
    } else {
      return this
    }
  }

  addParamsMap(paramsMap: Record<string, ParamValue | ParamValue[] | null | undefined>): QueryBuilder {
    Object.keys(paramsMap).forEach((key) => {
      const value = paramsMap[key]
      if (nonNull(value)) {
        if (isArray(value)) {
          value.forEach(entry => this.add(key, entry))
        } else {
          this.add(key, value)
        }
      }
    })
    return this
  }

  copy(): QueryBuilder {
    return new QueryBuilder(this.tuples.slice())
  }

  filteredCopy(predicate: (key: string, value: ParamValue) => boolean): QueryBuilder {
    return new QueryBuilder(this.tuples.filter(([k, v]) => predicate(k, v)))
  }

  toQueryString(): string {
    let acc = ''
    this.tuples.forEach(([k, v]) => {
      const operator = acc.length === 0 ? '?' : '&'
      acc = `${acc}${operator}${encodeURIComponent(k)}=${encodeURIComponent(v)}`
    })
    return acc
  }
}

// for use with QueryBuilder#addOptionalParam. Null has a special meaning for the idCookie.
export function encodeIdCookie(value: string | null | undefined): string | undefined {
  return value === null ? '' : onNonNull(value, md5)
}
