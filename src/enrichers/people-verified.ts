import { PEOPLE_VERIFIED_LS_ENTRY } from '../utils/consts'
import { IMinimalStorageHandler, State } from '../types'

<<<<<<< HEAD:src/enrichers/people-verified.ts
export function enrich (state: State, storageHandler: IMinimalStorageHandler) {
=======
export function enrich (state, storageHandler, eventBus) {
>>>>>>> master:src/enrichers/people-verified.js
  console.log('people-verified.enrich', state)
  try {
    return { peopleVerifiedId: state.peopleVerifiedId || storageHandler.getDataFromLocalStorage(PEOPLE_VERIFIED_LS_ENTRY) }
  } catch (e) {
    eventBus.emitError('PeopleVerifiedEnrich', e)
    return {}
  }
}
