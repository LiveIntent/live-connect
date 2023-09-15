import { Enricher } from '../types'
import { getPage, getReferrer, getContextElements } from '../utils/page'

type Input = { privacyMode: boolean, contextSelectors: string, contextElementsLength: number }
type Output = { pageUrl?: string, referrer?: string, contextElements: string }

export const enrichPage: Enricher<Input, Output> = state => {
  return {
    ...state,
    pageUrl: getPage(),
    referrer: getReferrer(),
    contextElements: getContextElements(state.privacyMode, state.contextSelectors, state.contextElementsLength)
  }
}

