import * as error from '../utils/emitter'

const REPLACEMENT_THRESHOLD_MILLIS = 181 * 864e5
const PEOPLE_VERIFIED_LS_ENTRY = '_li_duid'

function _setPeopleVerifiedStore (id, storageHandler) {
  if (id) {
    storageHandler.setDataInLocalStorage(PEOPLE_VERIFIED_LS_ENTRY, id)
  }
}

/**
 * @param {State} state
 * @param {StorageHandler} storageHandler
 */
export function resolve (state, storageHandler) {
  console.log('people-verified.resolve', state)
  try {
    const timeBefore = (new Date().getTime() - REPLACEMENT_THRESHOLD_MILLIS) / 1000
    const legacyIdentifier = state.legacyId || {}
    const lastVisit = legacyIdentifier.currVisitTs ? parseInt(legacyIdentifier.currVisitTs) : 0
    // Only overwrite the peopleVerified id if the entry for the legacy identifier exists, and it's old
    if (legacyIdentifier.currVisitTs && timeBefore > lastVisit && state.liveConnectId) {
      _setPeopleVerifiedStore(state.liveConnectId, storageHandler)
    }

    if (!storageHandler.getDataFromLocalStorage(PEOPLE_VERIFIED_LS_ENTRY)) {
      _setPeopleVerifiedStore(legacyIdentifier.duid || state.liveConnectId, storageHandler)
    }

    return { peopleVerifiedId: storageHandler.getDataFromLocalStorage(PEOPLE_VERIFIED_LS_ENTRY) }
  } catch (e) {
    error.error('PeopleVerifiedResolve', 'Error while managing people verified', e)
    return {}
  }
}
