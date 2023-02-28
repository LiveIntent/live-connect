import { State } from '../types'
import { extractEmail } from '../utils/email'
import { decodeValue } from '../utils/url'
import { extractHashValue, hashEmail, isHash } from '../utils/hash'
import { isArray, isObject, safeToString, trim } from 'live-connect-common'

const MAX_ITEMS = 10
const LIMITING_KEYS = ['items', 'itemids']
const HASH_BEARERS = ['email', 'emailhash', 'hash', 'hashedemail']

function _provided(state: State): State {
  const eventSource = state.eventSource || {}
  const objectKeys = Object.keys(eventSource)
  for (const key of objectKeys) {
    const lowerCased = key.toLowerCase()
    if (HASH_BEARERS.indexOf(lowerCased) > -1) {
      const value = trim(safeToString(eventSource[key as keyof (typeof eventSource)]))
      const extractedEmail = extractEmail(value)
      const extractedHash = extractHashValue(value)
      if (extractedEmail) {
        const hashes = hashEmail(decodeValue(extractedEmail))
        return mergeObjects({ hashedEmail: [hashes.md5, hashes.sha1, hashes.sha256] }, state)
      } else if (extractedHash && isHash(extractedHash)) {
        return mergeObjects({ hashedEmail: [extractedHash.toLowerCase()] }, state)
      }
    }
  }
  return state
}

function _itemsLimiter(state: State): State {
  const event = state.eventSource || {}
  Object.keys(event).forEach(key => {
    const lowerCased = key.toLowerCase()
    const value = event[key as keyof typeof event] as unknown
    if (LIMITING_KEYS.indexOf(lowerCased) > -1 && isArray(value) && value.length > MAX_ITEMS) {
      value.length = MAX_ITEMS
    }
  })
  return {}
}

const fiddlers = [_provided, _itemsLimiter]

export function fiddle(state: State): State {
  const reducer = (accumulator: State, func: (current: State) => State) => {
    return mergeObjects(accumulator, func(accumulator))
  }
  if (isObject(state.eventSource)) {
    return fiddlers.reduce(reducer, state)
  } else {
    return state
  }
}

export function mergeObjects<A extends object, B extends object>(obj1: A, obj2: B): A & B {
  const res = {} as A & B

  function clean<T>(obj: T): T | object {
    return isObject(obj) ? obj : {}
  }

  function keys<T extends object>(obj: T): (keyof T)[] {
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
