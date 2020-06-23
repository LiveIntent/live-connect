import * as error from '../utils/emitter'
import { urlParams } from '../utils/url'
import { trim, isUUID, expiresInDays } from '../utils/types'

const DEFAULT_DECISION_ID_COOKIE_EXPIRES = expiresInDays(30)
const DECISION_ID_QUERY_PARAM_NAME = 'li_did'
const DECISION_ID_COOKIE_NAMESPACE = 'lidids.'

const _onlyUnique = (value, index, self) => self.indexOf(value) === index
const _validUuid = (value) => isUUID(value)
const _nonEmpty = (value) => value && trim(value).length > 0

/**
 * @param {State} state
 * @param {StorageHandler} storageHandler
 */
export function resolve (state, storageHandler) {
  console.log('decisions.resolve', state)
  let ret = {}
  function _addDecisionId (key, cookieDomain) {
    if (key) {
      storageHandler.setCookie(
        `${DECISION_ID_COOKIE_NAMESPACE}${key}`,
        key,
        DEFAULT_DECISION_ID_COOKIE_EXPIRES,
        'Lax',
        cookieDomain)
    }
  }
  try {
    const params = (state.pageUrl && urlParams(state.pageUrl)) || {}
    const freshDecisions = [].concat(params[DECISION_ID_QUERY_PARAM_NAME] || [])
    const storedDecisions = storageHandler.findSimilarCookies(DECISION_ID_COOKIE_NAMESPACE)
    freshDecisions
      .map(trim)
      .filter(_nonEmpty)
      .filter(_validUuid)
      .filter(_onlyUnique)
      .forEach(decision => _addDecisionId(decision, state.domain))
    const allDecisions = freshDecisions
      .concat(storedDecisions)
      .map(trim)
      .filter(_nonEmpty)
      .filter(_validUuid)
      .filter(_onlyUnique)
    ret = { decisionIds: allDecisions }
  } catch (e) {
    error.error('DecisionsResolve', 'Error while managing decision ids', e)
  }
  return ret
}
