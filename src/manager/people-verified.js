import * as storage from '../utils/storage'
import * as error from '../utils/emitter'

const REPLACEMENT_THRESHOLD_MILLIS = 181 * 864e5
const PEOPLE_VERIFIED_LS_ENTRY = '_li_duid'

function _setPeopleVerifiedStore (id) {
  if (id) {
    storage.addToLs(PEOPLE_VERIFIED_LS_ENTRY, id)
  }
}

/**
 * @param {State} state
 */
export function resolve (state) {
  console.log('people-verified.resolve', state)
  try {
    const timeBefore = (new Date().getTime() - REPLACEMENT_THRESHOLD_MILLIS) / 1000
    const legacyIdentifier = state.legacyId || {}
    const lastVisit = legacyIdentifier.currVisitTs ? parseInt(legacyIdentifier.currVisitTs) : 0
    // Only overwrite the peopleVerified id if the entry for the legacy identifier exists, and it's old
    if (legacyIdentifier.currVisitTs && timeBefore > lastVisit) {
      _setPeopleVerifiedStore(state.liveConnectId)
    }

    if (!storage.getFromLs(PEOPLE_VERIFIED_LS_ENTRY)) {
      _setPeopleVerifiedStore(legacyIdentifier.duid || state.liveConnectId)
    }

    return { peopleVerifiedId: storage.getFromLs(PEOPLE_VERIFIED_LS_ENTRY) }
  } catch (e) {
    error.error('PeopleVerifiedResolve', 'Error while managing people verified', e)
    return {}
  }
}
