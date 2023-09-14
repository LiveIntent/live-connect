import { PEOPLE_VERIFIED_LS_ENTRY } from '../utils/consts'
import { EventBus, State } from '../types'
import { DurableCache } from '../cache'

export function enrich(state: State, cache: DurableCache, eventBus: EventBus): State {
  try {
    return { peopleVerifiedId: state.peopleVerifiedId || cache.get(PEOPLE_VERIFIED_LS_ENTRY)?.data || undefined }
  } catch (e) {
    eventBus.emitError('PeopleVerifiedEnrich', e)
    return {}
  }
}
