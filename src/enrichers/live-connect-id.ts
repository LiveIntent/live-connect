import { ulid } from '../utils/ulid.js'
import { domainHash } from '../utils/hash.js'
import { PEOPLE_VERIFIED_LS_ENTRY } from '../utils/consts.js'
import { Enricher } from '../types.js'
import { WrappedStorageHandler } from '../handlers/storage-handler.js'
import { DurableCache } from '../cache.js'

const NEXT_GEN_FP_NAME = '_lc2_fpi'

type Input = { cookieDomain: string }
type Output = { liveConnectId?: string, peopleVerifiedId?: string }

export function enrichLiveConnectId(
  cache: DurableCache,
  storageHandler: WrappedStorageHandler
): Enricher<Input, Output> {
  return state => {
    let liveConnectIdentifier
    // reading the value will also repair any broken records
    const oldValue = cache.get(NEXT_GEN_FP_NAME)
    if (oldValue) {
      liveConnectIdentifier = oldValue.data
    } else {
      const legacyValue = storageHandler.getCookie(NEXT_GEN_FP_NAME)
      if (legacyValue) {
        // backwards compatibility case. We have a cookie but no cache metadata.
        // We might overwrite a http cookie here. But this will be fixed with the next http request to cff.
        cache.set(NEXT_GEN_FP_NAME, legacyValue)
        liveConnectIdentifier = legacyValue
      } else {
        const newValue = `${domainHash(state.cookieDomain)}--${ulid()}`.toLocaleLowerCase()
        // will also set cookie. It will also later be extended by cookie bouncing in the cff.
        cache.set(NEXT_GEN_FP_NAME, newValue)
        // handle case when all storage backends are disabled
        liveConnectIdentifier = cache.get(NEXT_GEN_FP_NAME)?.data
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
}
