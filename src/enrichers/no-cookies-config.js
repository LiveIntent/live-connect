import { isNonEmpty } from '../utils/types'

export function enrich (state) {
  if (isNonEmpty(state) && isNonEmpty(state.gdprApplies)) {
    const gdprApplies = !!state.gdprApplies
    return {
      ...state,
      n3pc: gdprApplies,
      n3pc_ttl: gdprApplies,
      nbakers: gdprApplies
    }
  } else return state
}
