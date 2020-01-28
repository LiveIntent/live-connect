import * as storage from '../utils/storage'
import * as error from '../utils/emitter'
import { urlParams } from '../utils/url'
import { trim, isUUID } from '../utils/types'

const DEFAULT_DECISION_ID_COOKIE_TTL_MILLIS = 30 * 864e530
const DEFAULT_DECISION_ID_COOKIE_PATH = '/'
const DECISION_ID_QUERY_PARAM_NAME = 'li_did'
const DECISION_ID_COOKIE_NAMESPACE = 'lidids.'

function _addDecisionId (key, cookieDomain) {
  if (key) {
    storage.setCookie(
      `${DECISION_ID_COOKIE_NAMESPACE}${key}`,
      key,
      {
        domain: cookieDomain,
        expires: DEFAULT_DECISION_ID_COOKIE_TTL_MILLIS,
        path: DEFAULT_DECISION_ID_COOKIE_PATH
      })
  }
}

const _onlyUnique = (value, index, self) => self.indexOf(value) === index
const _validUuid = (value) => isUUID(value)
const _nonEmpty = (value) => value && trim(value).length > 0

/**
 * @param {State} state
 */
export function resolve (state) {
  console.log('decisions.resolve', state)
  let ret = {}
  try {
    const params = state.pageUrl ? urlParams(state.pageUrl) || {} : {}
    const freshDecisions = [].concat(params[DECISION_ID_QUERY_PARAM_NAME] || [])
    const storedDecisions = storage.findSimilarInJar(DECISION_ID_COOKIE_NAMESPACE)
    freshDecisions
      .filter(_validUuid)
      .filter(_onlyUnique)
      .filter(_nonEmpty)
      .map(trim)
      .forEach(decision => _addDecisionId(decision, state.domain))
    const allDecisions = freshDecisions
      .concat(storedDecisions)
      .filter(_validUuid)
      .filter(_onlyUnique)
      .filter(_nonEmpty)
      .map(trim)
    ret = { decisionIds: allDecisions }
  } catch (e) {
    error.error('DecisionsResolve', 'Error while managing decision ids', e)
  }
  return ret
}
