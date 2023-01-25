import { PEOPLE_VERIFIED_LS_ENTRY } from '../utils/consts'
import { EventBus, State } from '../types'
import { MinimalStorageHandler } from '../handlers/storage-handler'

export function enrich (state: State, storageHandler: MinimalStorageHandler, eventBus: EventBus): State {
  try {
    return { peopleVerifiedId: state.peopleVerifiedId || storageHandler.getDataFromLocalStorage(PEOPLE_VERIFIED_LS_ENTRY) || undefined }
  } catch (e) {
    eventBus.emitError('PeopleVerifiedEnrich', e)
    return {}
  }
}
