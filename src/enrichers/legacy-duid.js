import * as emitter from '../utils/emitter'
import { getLegacyId, getLegacyIdentifierKey } from '../utils/legacy'

/**
 * @param {State} state
 * @param {StorageHandler} storageHandler
 */
export function enrich (state, storageHandler) {
  console.log('legacy-duid.enrich', state)
  try {
    return state.appId && storageHandler.localStorageIsEnabled() && { legacyId: getLegacyId(storageHandler.getDataFromLocalStorage(getLegacyIdentifierKey())) }
  } catch (e) {
    emitter.error('LegacyDuidEnrich', 'Error while getting legacy duid', e)
  }
  return {}
}
