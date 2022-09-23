import * as error from '../utils/emitter'
import { PEOPLE_VERIFIED_LS_ENTRY } from '../utils/consts'
import { IMinimalStorageHandler, State } from '../types'

export function enrich (state: State, storageHandler: IMinimalStorageHandler) {
  console.log('people-verified.enrich', state)
  try {
    return { peopleVerifiedId: state.peopleVerifiedId || storageHandler.getDataFromLocalStorage(PEOPLE_VERIFIED_LS_ENTRY) }
  } catch (e) {
    error.error('PeopleVerifiedEnrich', e.message, e)
    return {}
  }
}
