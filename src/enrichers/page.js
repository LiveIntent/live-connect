import { getPage, getReferrer } from '../utils/page'

/**
 * @private
 */
let _currentPage = null

/**
 * @param state
 * @return {{pageUrl: string|undefined, referrer: string|undefined}}
 */
export function enrich (state) {
  if (!_currentPage) {
    _currentPage = {
      pageUrl: getPage(),
      referrer: getReferrer()
    }
  }
  return _currentPage
}
