import { State } from '../pixel/state'
import { isNonEmpty } from '../utils/types'

export function enrich (state: State): State {
  if (isNonEmpty(state) && isNonEmpty(state.gdprApplies)) {
    const privacyMode = !!state.gdprApplies
    return {
      privacyMode: privacyMode
    }
  } else return {}
}
