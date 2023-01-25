import { PEOPLE_VERIFIED_LS_ENTRY } from '../utils/consts'
import { EventBus, IMinimalStorageHandler, State } from '../types'

export function enrich (state: State, storageHandler: IMinimalStorageHandler, eventBus: EventBus): State {
  try {
    return { peopleVerifiedId: state.peopleVerifiedId || storageHandler.getDataFromLocalStorage(PEOPLE_VERIFIED_LS_ENTRY) || undefined }
  } catch (e) {
    eventBus.emitError('PeopleVerifiedEnrich', e)
    return {}
  }
}
