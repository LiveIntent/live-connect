import { base64UrlEncode } from '../utils/b64'
import { fromError } from '../utils/emitter'
import { expiresInHours } from '../utils/types'

export interface Cache {
  get: (key: any) => any
  set: (key: any, value: any) => void
}

export function storageHandlerBackedCache (expirationHours: Number, domain: String, storageHandler: any): Cache {
  const IDEX_STORAGE_KEY = '__li_idex_cache'

  function _cacheKey (rawKey: any): string {
    if (rawKey) {
      const suffix = base64UrlEncode(JSON.stringify(rawKey))
      return `${IDEX_STORAGE_KEY}_${suffix}`
    } else {
      return IDEX_STORAGE_KEY
    }
  }

  return {
    get: (key) => {
      const cachedValue = storageHandler.get(_cacheKey(key))
      if (cachedValue) {
        return JSON.parse(cachedValue)
      } else {
        return cachedValue
      }
    },
    set: (key, value) => {
      try {
        storageHandler.set(
          _cacheKey(key),
          JSON.stringify(value),
          expiresInHours(expirationHours),
          domain
        )
      } catch (ex) {
        fromError('IdentityResolverStorage', ex)
      }
    }
  }
}

export const noopCache: Cache = {
  get: (key) => null,
  set: (key, value) => undefined
}
