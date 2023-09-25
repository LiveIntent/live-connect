import { Enricher } from '../types'

type Input = { gdprApplies?: boolean }
type Output = { privacyMode: boolean }

export const enrichPrivacyMode: Enricher<Input, Output> = state =>
  ({ ...state, privacyMode: !!state.gdprApplies })
