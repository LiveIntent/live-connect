import { Enricher } from '../types'

type Input = { gdprApplies?: boolean, gppApplicableSections?: number[] }
type Output = { privacyMode: boolean }

export const enrichPrivacyMode: Enricher<Input, Output> = state =>
  ({ ...state, privacyMode: !!state.gdprApplies || ((state.gppApplicableSections ?? []).indexOf(2) > -1) })
