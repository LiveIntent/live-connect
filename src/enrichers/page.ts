import { State } from '../types'
import { getPage, getReferrer, getContextElements } from '../utils/page'

/**
 * @private
 */
let _currentPage: State | null = null

export function enrich (state: State): State {
  if (_currentPage) {
    return _currentPage
  } else {
    const result = {
      pageUrl: getPage(),
      referrer: getReferrer(),
      contextElements: getContextElements(state.privacyMode, state.contextSelectors, state.contextElementsLength)
    }
    _currentPage = result
    return result
  }
}
