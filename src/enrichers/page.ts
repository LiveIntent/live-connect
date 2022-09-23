import { State } from '../types'
import { getPage, getReferrer, getContextElements } from '../utils/page'

/**
 * @private
 */
let _currentPage = null

export function enrich (state: State): State {
  if (!_currentPage) {
    _currentPage = {
      pageUrl: getPage(),
      referrer: getReferrer(),
      contextElements: getContextElements(state.privacyMode, state.contextSelectors, state.contextElementsLength)
    }
  }
  return _currentPage
}
