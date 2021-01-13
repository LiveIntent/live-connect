import { ulid } from '../utils/ulid'
import * as emitter from '../utils/emitter'
import { loadedDomain } from '../utils/page'
import { domainHash } from '../utils/hash'
import { expiresIn, expiresInDays, strEqualsIgnoreCase } from '../utils/types'
import { StorageStrategy } from '../model/storage-strategy'
import { PEOPLE_VERIFIED_LS_ENTRY } from '../utils/consts'

const NEXT_GEN_FP_NAME = '_lc2_fpi'
const TLD_CACHE_KEY = '_li_dcdm_c'
const DEFAULT_EXPIRATION_DAYS = 730

/**
 * @param {State} state
 * @param {StorageHandler} storageHandler
 */
export function resolve (state, storageHandler) {
  try {
    console.log('identifiers.resolve', state)

    const determineTld = () => {
      const cachedDomain = storageHandler.getCookie(TLD_CACHE_KEY)
      if (cachedDomain) {
        return cachedDomain
      }
      const domain = loadedDomain()
      const arr = domain.split('.')
      for (let i = arr.length; i > 0; i--) {
        const newD = `.${arr.slice(i - 1, arr.length).join('.')}`
        storageHandler.setCookie(TLD_CACHE_KEY, newD, undefined, 'Lax', newD)
        if (storageHandler.getCookie(TLD_CACHE_KEY)) {
          return newD
        }
      }
      return `.${domain}`
    }

    const lsGetOrAdd = (key, value, storageOptions) => {
      let ret = null
      try {
        if (storageHandler.localStorageIsEnabled()) {
          const expirationKey = `${key}_exp`
          const oldLsExpirationEntry = storageHandler.getDataFromLocalStorage(expirationKey)
          const expiry = expiresIn(storageOptions.expires, 864e5)
          if (oldLsExpirationEntry && parseInt(oldLsExpirationEntry) <= new Date().getTime()) {
            storageHandler.removeDataFromLocalStorage(key)
          }
          const oldLsEntry = storageHandler.getDataFromLocalStorage(key)
          if (!oldLsEntry) {
            storageHandler.setDataInLocalStorage(key, value)
          }
          storageHandler.setDataInLocalStorage(expirationKey, `${expiry}`)
          ret = storageHandler.getDataFromLocalStorage(key)
        }
      } catch (e) {
        emitter.error('LSGetOrAdd', 'Error manipulating LS', e)
      }
      return ret
    }

    const cookieGetOrAdd = (key, value, storageOptions) => {
      let ret = null
      try {
        const oldCookie = storageHandler.getCookie(key)
        if (oldCookie) {
          storageHandler.setCookie(key, oldCookie, expiresInDays(storageOptions.expires), 'Lax', storageOptions.domain)
        } else {
          storageHandler.setCookie(key, value, expiresInDays(storageOptions.expires), 'Lax', storageOptions.domain)
        }
        ret = storageHandler.getCookie(key)
      } catch (e) {
        emitter.error('CookieGetOrAdd', 'Failed manipulating cookie jar', e)
      }
      return ret
    }

    const getOrAddWithExpiration = (key, value, storageOptions, storageStrategy) => {
      if (strEqualsIgnoreCase(storageStrategy, StorageStrategy.localStorage)) {
        return lsGetOrAdd(key, value, storageOptions)
      } else if (strEqualsIgnoreCase(storageStrategy, StorageStrategy.none)) {
        return null
      } else {
        return cookieGetOrAdd(key, value, storageOptions)
      }
    }

    /**
     * @param {string} apexDomain
     * @returns {string}
     * @private
     */
    const generateCookie = (apexDomain) => {
      const cookie = `${domainHash(apexDomain)}--${ulid()}`
      return cookie.toLocaleLowerCase()
    }

    const expiry = state.expirationDays || DEFAULT_EXPIRATION_DAYS
    const cookieDomain = determineTld()
    const storageOptions = {
      expires: expiry,
      domain: cookieDomain
    }
    const liveConnectIdentifier = getOrAddWithExpiration(
      NEXT_GEN_FP_NAME,
      generateCookie(cookieDomain),
      storageOptions,
      state.storageStrategy)

    if (liveConnectIdentifier) {
      storageHandler.setDataInLocalStorage(PEOPLE_VERIFIED_LS_ENTRY, liveConnectIdentifier)
    }
    return {
      domain: cookieDomain,
      liveConnectId: liveConnectIdentifier,
      peopleVerifiedId: liveConnectIdentifier
    }
  } catch (e) {
    emitter.error('IdentifiersResolve', 'Error while managing identifiers', e)
    return {}
  }
}
