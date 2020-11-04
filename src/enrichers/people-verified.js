import * as error from '../utils/emitter'
import { PEOPLE_VERIFIED_LS_ENTRY } from '../utils/consts'

export function enrich (state, storageHandler) {
  console.log('people-verified.enrich', state)
  try {
    return { peopleVerifiedId: storageHandler.getDataFromLocalStorage(PEOPLE_VERIFIED_LS_ENTRY) }
  } catch (e) {
    error.error('E.PV', e.message, e)
    return {}
  }
}
