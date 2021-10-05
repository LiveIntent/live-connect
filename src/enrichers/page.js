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
  const { contextSelectors, contextElementsLength } = _parseContext(state)
  if (!_currentPage) {
    _currentPage = {
      pageUrl: getPage(),
      referrer: getReferrer(),
      contextElements: getContextElements(contextSelectors, contextElementsLength)
    }
  }
  return _currentPage
}

/**
 * @param {State} state
 * @returns {{pageUrl: string|undefined, referrer: string|undefined}}
 * @private
 */
function _parseContext (state) {
  return {
    contextSelectors: state.contextSelectors,
    contextElementsLength: state.contextElementsLength
  }
}
