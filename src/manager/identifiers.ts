import { ulid } from '../utils/ulid'
import { loadedDomain } from '../utils/page'
import { domainHash } from '../utils/hash'
import { EventBus, expiresInDays } from 'live-connect-common'
import { PEOPLE_VERIFIED_LS_ENTRY } from '../utils/consts'
import { State } from '../types'
import { WrappedStorageHandler } from '../handlers/storage-handler'

const NEXT_GEN_FP_NAME = '_lc2_fpi'
const TLD_CACHE_KEY = '_li_dcdm_c'
const DEFAULT_EXPIRATION_DAYS = 730

export function resolve(state: State, storageHandler: WrappedStorageHandler, eventBus: EventBus): State {
  try {
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

    const getOrAddWithExpiration = (key: string, value: string) => {
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
        eventBus.emitErrorWithMessage('CookieLsGetOrAdd', 'Failed manipulating cookie jar or ls', e)
        return null
      }
    }

    const generateCookie = (apexDomain: string) => {
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
    ) || undefined

    if (liveConnectIdentifier) {
      storageHandler.setDataInLocalStorage(PEOPLE_VERIFIED_LS_ENTRY, liveConnectIdentifier)
    }
    return {
      domain: cookieDomain,
      liveConnectId: liveConnectIdentifier,
      peopleVerifiedId: liveConnectIdentifier
    }
  } catch (e) {
    eventBus.emitErrorWithMessage('IdentifiersResolve', 'Error while managing identifiers', e)
    return {}
  }
}
