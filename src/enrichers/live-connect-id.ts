import { ulid } from '../utils/ulid'
import { domainHash } from '../utils/hash'
import { expiresInDays } from 'live-connect-common'
import { NEXT_GEN_FP_NAME, PEOPLE_VERIFIED_LS_ENTRY } from '../utils/consts'
import { Enricher } from '../types'
import { WrappedStorageHandler } from '../handlers/storage-handler'
import { DurableCache } from '../cache'

const CACHE_KEY = '_lc2_fpi_cache'
const DEFAULT_EXPIRATION_DAYS = 730

type Input = { expirationDays?: number, domain: string, cache: DurableCache, storageHandler: WrappedStorageHandler }
type Output = { liveConnectId?: string, peopleVerifiedId?: string }

export const enrichLiveConnectId: Enricher<Input, Output> = state => {
  const { expirationDays, domain, storageHandler, cache } = state

  const expiry = expirationDays || DEFAULT_EXPIRATION_DAYS

  // sync cookiejar and cache. Prefer cookiejar value as it will live longer than cache and we don't want to overwrite it
  let liveConnectIdentifier
  const oldValue = storageHandler.getCookie(NEXT_GEN_FP_NAME)
  if (oldValue) {
    cache.set(CACHE_KEY, oldValue, expiresInDays(expiry))
    liveConnectIdentifier = oldValue
  } else {
    // try retrieving from cache
    const cachedValue = cache.get(CACHE_KEY)
    if (cachedValue) {
      storageHandler.setCookie(NEXT_GEN_FP_NAME, cachedValue.data, cachedValue.meta.expiresAt, 'Lax')
      liveConnectIdentifier = cachedValue.data
    } else {
      // generate new value
      const newValue = `${domainHash(domain)}--${ulid()}`.toLocaleLowerCase()
      const expiresAt = expiresInDays(expiry)

      storageHandler.setCookie(NEXT_GEN_FP_NAME, newValue, expiresAt, 'Lax')
      cache.set(CACHE_KEY, newValue, expiresAt)

      // handle case where underlying storage is disabled.
      liveConnectIdentifier = storageHandler.getCookie(NEXT_GEN_FP_NAME) || cache.get(CACHE_KEY)?.data || undefined
    }
  }

  if (liveConnectIdentifier) {
    // TODO: should we expose this to users even if the write failed?
    storageHandler.setDataInLocalStorage(PEOPLE_VERIFIED_LS_ENTRY, liveConnectIdentifier)
  }

  return {
    ...state,
    liveConnectId: liveConnectIdentifier,
    peopleVerifiedId: liveConnectIdentifier
  }
}
