import { getPage, getReferrer, getContextElements } from '../utils/page'

/**
 * @private
 */
let _currentPage = null

/**
 * @param state
 * @return {{pageUrl: string|undefined, referrer: string|undefined, contextElements: string|undefined}}
 */
export function enrich (state) {
  if (!_currentPage) {
    _currentPage = {
      pageUrl: getPage(),
      referrer: getReferrer(),
      contextElements: getContextElements(state.privacyMode, state.contextSelectors, state.contextElementsLength)
    }
  }
  return _currentPage
}
