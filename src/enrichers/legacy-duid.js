import * as emitter from '../utils/emitter'
import { getLegacyId, getLegacyIdentifierKey } from '../utils/legacy'

/**
 * @param {State} state
 * @param {StorageHandler} storageHandler
 */
export function enrich (state, storageHandler) {
  console.log('legacy-duid.enrich', state)
  const duidLsKey = getLegacyIdentifierKey()
  try {
    if (state.appId && storageHandler.hasLocalStorage()) {
      const previousIdentifier = storageHandler.getDataFromLocalStorage(duidLsKey)
      const legacyId = getLegacyId(previousIdentifier)
      return {
        legacyId: legacyId
      }
    }
  } catch (e) {
    emitter.error('LegacyDuidEnrich', 'Error while getting legacy duid', e)
  }
  return {}
}
