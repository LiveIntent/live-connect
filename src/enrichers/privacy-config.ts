import { State } from '../types'
import { isNonEmpty } from 'live-connect-common'

export function enrich(state: State): State {
  if (isNonEmpty(state) && isNonEmpty(state.gdprApplies)) {
    const privacyMode = !!state.gdprApplies
    return { privacyMode }
  } else return {}
}
