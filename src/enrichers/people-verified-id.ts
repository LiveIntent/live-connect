import { PEOPLE_VERIFIED_LS_ENTRY } from '../utils/consts.js'
import { Enricher, EventBus } from '../types.js'
import { WrappedReadOnlyStorageHandler } from '../handlers/storage-handler.js'

type Input = { peopleVerifiedId?: string }
type Output = { peopleVerifiedId?: string }

export function enrichPeopleVerifiedId(storageHandler: WrappedReadOnlyStorageHandler, eventBus: EventBus): Enricher<Input, Output> {
  return state => {
    try {
      return {
        ...state,
        peopleVerifiedId: state.peopleVerifiedId || storageHandler.getDataFromLocalStorage(PEOPLE_VERIFIED_LS_ENTRY) || undefined
      }
    } catch (e) {
      eventBus.emitError('PeopleVerifiedEnrich', e)
      return state
    }
  }
}
