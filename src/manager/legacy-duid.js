import * as emitter from '../utils/emitter'
import uuid from 'tiny-uuid4'
import { addToLs, getFromLs } from '../utils/storage'
import { getLegacyId, getLegacyIdentifierKey, legacyIdAsString } from '../utils/legacy'

const _now = () => Math.round(new Date().getTime() / 1000)

/**
 * @param {State} state
 */
export function resolve (state) {
  console.log('legacy-duid.resolve', state)
  try {
    const duidLsKey = getLegacyIdentifierKey()
    if (state.appId) {
      const previousIdentifier = getFromLs(duidLsKey)
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
      addToLs(duidLsKey, legacyIdAsString(legacyIdToStore))
    }
  } catch (e) {
    emitter.error('LegacyDuidResolve', 'Error while managing legacy duid', e)
  }
  return {}
}
