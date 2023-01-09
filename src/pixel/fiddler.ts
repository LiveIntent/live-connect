import { State } from '../types'
import { extractEmail } from '../utils/email'
import { decodeValue } from '../utils/url'
import { extractHashValue, hashEmail, isHash } from '../utils/hash'
import { isArray, isObject, safeToString, trim, merge } from '../utils/types'

const MAX_ITEMS = 10
const LIMITING_KEYS = ['items', 'itemids']
const HASH_BEARERS = ['email', 'emailhash', 'hash', 'hashedemail']

function _provided (state: State): State {
  const eventSource = state.eventSource
  const objectKeys = Object.keys(eventSource)
  for (const key of objectKeys) {
    const lowerCased = key.toLowerCase()
    if (HASH_BEARERS.indexOf(lowerCased) > -1) {
      const value = trim(safeToString(eventSource[key]))
      const extractedEmail = extractEmail(value)
      const extractedHash = extractHashValue(value)
      if (extractedEmail) {
        const hashes = hashEmail(decodeValue(extractedEmail))
        return merge({ hashedEmail: [hashes.md5, hashes.sha1, hashes.sha256] }, state)
      } else if (extractedHash && isHash(extractedHash)) {
        return merge({ hashedEmail: [extractedHash.toLowerCase()] }, state)
      }
    }
  }
  return state
}

function _itemsLimiter (state: State): State {
  const event = state.eventSource
  Object.keys(event).forEach(key => {
    const lowerCased = key.toLowerCase()
    if (LIMITING_KEYS.indexOf(lowerCased) > -1 && isArray(event[key]) && event[key].length > MAX_ITEMS) {
      event[key].length = MAX_ITEMS
    }
  })
  return {}
}

const fiddlers = [_provided, _itemsLimiter]

export function fiddle (state: State): State {
  const reducer = (accumulator, func) => {
    return merge(accumulator, func(accumulator))
  }
  if (isObject(state.eventSource)) {
    return fiddlers.reduce(reducer, state)
  } else {
    return state
  }
}
