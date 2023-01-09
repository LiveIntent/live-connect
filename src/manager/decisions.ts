import { getQueryParameter } from '../utils/url'
import { trim, isUUID, expiresInDays } from '../utils/types'
import { EventBus, IStorageHandler, State } from '../types'

const DEFAULT_DECISION_ID_COOKIE_EXPIRES = expiresInDays(30)
const DECISION_ID_QUERY_PARAM_NAME = 'li_did'
const DECISION_ID_COOKIE_NAMESPACE = 'lidids.'

const _onlyUnique = (value, index, self) => self.indexOf(value) === index
const _validUuid = (value) => isUUID(value)
const _nonEmpty = (value) => value && trim(value).length > 0

export function resolve (state: State, storageHandler: IStorageHandler, eventBus: EventBus): State {
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
    const freshDecisions = [].concat((state.pageUrl && getQueryParameter(state.pageUrl, DECISION_ID_QUERY_PARAM_NAME)) || [])
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
    eventBus.emitErrorWithMessage('DecisionsResolve', 'Error while managing decision ids', e)
  }
  return ret
}
