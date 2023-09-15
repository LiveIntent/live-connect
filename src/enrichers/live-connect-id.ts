import { ulid } from '../utils/ulid'
import { domainHash } from '../utils/hash'
import { expiresInDays } from 'live-connect-common'
import { PEOPLE_VERIFIED_LS_ENTRY } from '../utils/consts'
import { Enricher } from '../types'
import { WrappedStorageHandler } from '../handlers/storage-handler'
import { DurableCache } from '../cache'

const NEXT_GEN_FP_NAME = '_lc2_fpi'
const DEFAULT_EXPIRATION_DAYS = 730

type Input = { expirationDays?: number, domain: string, cache: DurableCache, storageHandler: WrappedStorageHandler }
type Output = { liveConnectId?: string, peopleVerifiedId?: string }

export const enrichLiveConnectId: Enricher<Input, Output> = state => {
  const { expirationDays, domain, storageHandler, cache } = state

  const expiry = expirationDays || DEFAULT_EXPIRATION_DAYS
  const oldValue = cache.get(NEXT_GEN_FP_NAME)?.data

  if (oldValue) {
    cache.set(NEXT_GEN_FP_NAME, oldValue, expiresInDays(expiry))
  } else {
    const newValue = `${domainHash(domain)}--${ulid()}`.toLocaleLowerCase()
    cache.set(NEXT_GEN_FP_NAME, newValue, expiresInDays(expiry))
  }

  const liveConnectIdentifier = cache.get(NEXT_GEN_FP_NAME)?.data || undefined

  if (liveConnectIdentifier) {
    storageHandler.setDataInLocalStorage(PEOPLE_VERIFIED_LS_ENTRY, liveConnectIdentifier)
  }

  return {
    ...state,
    liveConnectId: liveConnectIdentifier,
    peopleVerifiedId: liveConnectIdentifier
  }
}
