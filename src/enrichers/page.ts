import { State } from '../pixel/state'
import { getPage, getReferrer, getContextElements } from '../utils/page'

/**
 * @private
 */
let _currentPage = null

interface _currentPage {
  pageUrl: () => string | undefined,
  referrer: () => string | undefined,
  contextElements: (privacyMode: boolean, contextSelectors: string[], contextElementsLength: number) => string | undefined,
}

/**
 * @param state
 * @return {{pageUrl: string|undefined, referrer: string|undefined, contextElements: string|undefined}}
 */
export function enrich(state: State): _currentPage {
  if (!_currentPage) {
    _currentPage = {
      pageUrl: getPage(),
      referrer: getReferrer(),
      contextElements: getContextElements(state.privacyMode, state.contextSelectors, state.contextElementsLength)
    }
  }
  return _currentPage
}
