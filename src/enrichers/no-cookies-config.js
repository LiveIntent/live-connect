import { isNonEmpty } from '../utils/types'

export function enrich (state) {
  if (isNonEmpty(state) && isNonEmpty(state.gdprApplies)) {
    const gdprApplies = !!state.gdprApplies
    return {
      n3pc: gdprApplies,
      n3pc_ttl: gdprApplies,
      nbakers: gdprApplies
    }
  } else return {}
}
