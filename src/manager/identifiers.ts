import { ulid } from '../utils/ulid'
import { loadedDomain } from '../utils/page'
import { domainHash } from '../utils/hash'
import { expiresInDays } from 'live-connect-common'
import { PEOPLE_VERIFIED_LS_ENTRY } from '../utils/consts'
import { EventBus, State } from '../types'
import { WrappedStorageHandler } from '../handlers/storage-handler'
import { DurableCache } from '../cache'

const NEXT_GEN_FP_NAME = '_lc2_fpi'
const DEFAULT_EXPIRATION_DAYS = 730

export function resolve(
  state: { expirationDays?: number, domain: string },
  storageHandler: WrappedStorageHandler,
  cache: DurableCache,
  eventBus: EventBus
): State {
  const expiry = state.expirationDays || DEFAULT_EXPIRATION_DAYS
  const oldValue = cache.get(NEXT_GEN_FP_NAME)?.data

  if (oldValue) {
    cache.set(NEXT_GEN_FP_NAME, oldValue, expiresInDays(expiry))
  } else {
    const newValue = `${domainHash(state.domain)}--${ulid()}`

    cache.set(NEXT_GEN_FP_NAME, newValue, expiresInDays(expiry))
  }

  const liveConnectIdentifier = cache.get(NEXT_GEN_FP_NAME)?.data || undefined

  if (liveConnectIdentifier) {
    storageHandler.setDataInLocalStorage(PEOPLE_VERIFIED_LS_ENTRY, liveConnectIdentifier)
  }

  return {
    liveConnectId: liveConnectIdentifier,
    peopleVerifiedId: liveConnectIdentifier
  }
}
