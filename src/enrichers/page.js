import { getPage } from '../utils/page'

/**
 * @private
 */
let _currentPage = null

/**
 * @param state
 * @return {{pageUrl: *}}
 */
export function enrich (state) {
  if (!_currentPage) {
    _currentPage = getPage()
  }
  return { pageUrl: _currentPage }
}
