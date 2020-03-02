import * as emitter from '../utils/emitter'
import uuid from 'tiny-uuid4'
import { getLegacyId, getLegacyIdentifierKey, legacyIdAsString } from '../utils/legacy'

const _now = () => Math.round(new Date().getTime() / 1000)

/**
 * @param {State} state
 * @param {StorageHandler} storageHandler
 */
export function resolve (state, storageHandler) {
  console.log('legacy-duid.resolve', state, storageHandler)
  try {
    const duidLsKey = getLegacyIdentifierKey()
    if (state.appId) {
      const previousIdentifier = storageHandler.getDataFromLocalStorage(duidLsKey)
      let legacyIdToStore = getLegacyId(previousIdentifier)
      if (previousIdentifier && legacyIdToStore) {
        legacyIdToStore.lastSessionVisitTs = legacyIdToStore.currVisitTs
        legacyIdToStore.currVisitTs = `${_now()}`
      } else {
        legacyIdToStore = {
          duid: `${state.appId}--${uuid()}`,
          creationTs: _now(),
          sessionCount: 1,
          currVisitTs: _now(),
          lastSessionVisitTs: _now(),
          sessionId: uuid()
        }
      }
      storageHandler.setDataInLocalStorage(duidLsKey, legacyIdAsString(legacyIdToStore))
    }
  } catch (e) {
    emitter.error('LegacyDuidResolve', 'Error while managing legacy duid', e)
  }
  return {}
}
