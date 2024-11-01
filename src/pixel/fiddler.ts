import { extractEmail } from '../utils/email.js'
import { decodeValue } from '../utils/url.js'
import { extractHashValue, hashEmail, isHash } from '../utils/hash.js'
import { isArray, isObject, isRecord, safeToString, trim } from 'live-connect-common'
import { FiddlerExtraFields } from '../types.js'

type AnyRecord = Record<string | symbol | number, unknown>

const MAX_ITEMS = 10
const LIMITING_KEYS = ['items', 'itemids']
const HASH_BEARERS = ['email', 'emailhash', 'hash', 'hashedemail']

function extractProvidedAttributes(eventSource: AnyRecord): FiddlerExtraFields {
  const extraFields: FiddlerExtraFields = { eventSource }

  // add provided email hashes. Only consider the first one found.
  for (const key of Object.keys(eventSource)) {
    const lowerCased = key.toLowerCase()
    if (HASH_BEARERS.indexOf(lowerCased) > -1) {
      const value = trim(safeToString(eventSource[key]))
      const extractedEmail = extractEmail(value)
      const extractedHash = extractHashValue(value)
      if (extractedEmail) {
        const hashes = hashEmail(decodeValue(extractedEmail))
        extraFields.hashedEmail = [hashes.md5, hashes.sha1, hashes.sha256]
        break
      } else if (extractedHash && isHash(extractedHash)) {
        extraFields.hashedEmail = [extractedHash.toLowerCase()]
        break
      }
    }
  }

  // add provided user agent
  if (typeof eventSource.userAgent === 'string') {
    extraFields.providedUserAgent = eventSource.userAgent
  }

  // add provided ip4 address
  if (typeof eventSource.ipv4 === 'string') {
    extraFields.providedIPV4 = eventSource.ipv4
  }

  // add provided ip6 address
  if (typeof eventSource.ipv6 === 'string') {
    extraFields.providedIPV6 = eventSource.ipv6
  }

  return extraFields
}

function limitItems(event: AnyRecord): AnyRecord {
  const limitedEvent: AnyRecord = {}
  Object.keys(event).forEach(key => {
    const lowerCased = key.toLowerCase()
    const value = event[key]
    if (LIMITING_KEYS.indexOf(lowerCased) > -1 && isArray(value) && value.length > MAX_ITEMS) {
      limitedEvent[key] = value.slice(0, MAX_ITEMS)
    } else {
      limitedEvent[key] = value
    }
  })
  return limitedEvent
}

export function fiddle(event: object): FiddlerExtraFields {
  if (isRecord(event)) {
    const extraAttributes = extractProvidedAttributes(event)
    return {
      ...extraAttributes,
      eventSource: limitItems(event)
    }
  } else {
    return {}
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
