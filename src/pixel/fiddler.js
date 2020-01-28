import { extractEmail } from '../utils/email'
import { extractHashValue, hashEmail, isHash } from '../utils/hash'
import { isArray, isObject, safeToString, trim } from '../utils/types'

const MAX_ITEMS = 10
const LIMITING_KEYS = ['items', 'itemids']
const HASH_BEARERS = ['email', 'emailhash', 'hash', 'hashedemail']

function _provided (state) {
  const eventSource = state.eventSource
  const objectKeys = Object.keys(eventSource)
  for (const key of objectKeys) {
    const lowerCased = key.toLowerCase()
    if (HASH_BEARERS.indexOf(lowerCased) > -1) {
      const value = trim(safeToString(eventSource[key]))
      const extractedEmail = extractEmail(value)
      const extractedHash = extractHashValue(value)
      if (extractedEmail) {
        const hashes = hashEmail(decodeURIComponent(extractedEmail))
        const hashesArray = [hashes.md5, hashes.sha1, hashes.sha256]
        return {
          ...{ hashedEmail: hashesArray },
          ...state
        }
      } else if (extractedHash && isHash(extractedHash)) {
        const hashesArray = [extractedHash.toLowerCase()]
        return {
          ...{ hashedEmail: hashesArray },
          ...state
        }
      }
    }
  }
  return state
}

function _itemsLimiter (state) {
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

export function fiddle (state) {
  const reducer = (accumulator, func) => {
    return { ...accumulator, ...func(accumulator) }
  }
  if (isObject(state.eventSource)) {
    return fiddlers.reduce(reducer, state)
  } else {
    return state
  }
}
