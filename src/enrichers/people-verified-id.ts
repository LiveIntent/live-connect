import { PEOPLE_VERIFIED_LS_ENTRY } from '../utils/consts'
import { Enricher, EventBus } from '../types'
import { WrappedReadOnlyStorageHandler } from '../handlers/storage-handler'

type Input = { peopleVerifiedId?: string, storageHandler: WrappedReadOnlyStorageHandler, eventBus: EventBus }
type Output = { peopleVerifiedId?: string }

export const enrichPeopleVerifiedId: Enricher<Input, Output> = state => {
  try {
    return {
      ...state,
      peopleVerifiedId: state.peopleVerifiedId || state.storageHandler.getDataFromLocalStorage(PEOPLE_VERIFIED_LS_ENTRY) || undefined
    }
  } catch (e) {
    state.eventBus.emitError('PeopleVerifiedEnrich', e)
    return state
  }
}

