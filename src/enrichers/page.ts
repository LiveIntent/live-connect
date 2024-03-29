import { Enricher } from '../types.js'
import { getPage, getReferrer, getContextElements } from '../utils/page.js'

type Input = { privacyMode: boolean, contextSelectors: string, contextElementsLength: number }
type Output = { pageUrl?: string, referrer?: string, contextElements: string }

export const enrichPage: Enricher<Input, Output> = state => ({
  ...state,
  pageUrl: getPage(),
  referrer: getReferrer(),
  contextElements: getContextElements(state.privacyMode, state.contextSelectors, state.contextElementsLength)
})
