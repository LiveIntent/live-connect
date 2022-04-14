import { isNonEmpty } from '../utils/types'

export function enrich (state) {
  if (isNonEmpty(state) && isNonEmpty(state.gdprApplies)) {
    const privacyMode = !!state.gdprApplies
    return {
      privacyMode: privacyMode
    }
  } else return {}
}
