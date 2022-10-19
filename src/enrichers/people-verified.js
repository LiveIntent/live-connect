import { PEOPLE_VERIFIED_LS_ENTRY } from '../utils/consts'

export function enrich (state, storageHandler, messageBus) {
  console.log('people-verified.enrich', state)
  try {
    return { peopleVerifiedId: state.peopleVerifiedId || storageHandler.getDataFromLocalStorage(PEOPLE_VERIFIED_LS_ENTRY) }
  } catch (e) {
    messageBus.encodeEmitError('PeopleVerifiedEnrich', e)
    return {}
  }
}
