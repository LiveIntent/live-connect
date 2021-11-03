import { ulid } from '../utils/ulid'
import * as emitter from '../utils/emitter'
import { loadedDomain } from '../utils/page'
import { domainHash } from '../utils/hash'
import { expiresInDays } from '../utils/types'
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

    const getOrAddWithExpiration = (key, value) => {
      try {
        const oldValue = storageHandler.get(key)
        const expiry = expiresInDays(storageOptions.expires)
        if (oldValue) {
          storageHandler.set(key, oldValue, expiry, storageOptions.domain)
        } else {
          storageHandler.set(key, value, expiry, storageOptions.domain)
        }
        return storageHandler.get(key)
      } catch (e) {
        emitter.error('CookieLsGetOrAdd', 'Failed manipulating cookie jar or ls', e)
        return null
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
      generateCookie(cookieDomain)
    )

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
