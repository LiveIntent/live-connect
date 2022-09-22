import { State } from '../pixel/state'
import { getPage, getReferrer, getContextElements } from '../utils/page'

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
