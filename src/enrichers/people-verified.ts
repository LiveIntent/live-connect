import { PEOPLE_VERIFIED_LS_ENTRY } from '../utils/consts'
import { State } from '../types'
import { EventBus } from 'live-connect-common'
import { WrappedReadOnlyStorageHandler } from '../handlers/storage-handler'

export function enrich(state: State, storageHandler: WrappedReadOnlyStorageHandler, eventBus: EventBus): State {
  try {
    return { peopleVerifiedId: state.peopleVerifiedId || storageHandler.getDataFromLocalStorage(PEOPLE_VERIFIED_LS_ENTRY) || undefined }
  } catch (e) {
    eventBus.emitError('PeopleVerifiedEnrich', e)
    return {}
  }
}
