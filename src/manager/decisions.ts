import { getQueryParameter, ParsedParam } from '../utils/url'
import { trim, isUUID, expiresInDays } from '../utils/types'
import { EventBus, State } from '../types'
import { StorageHandler } from '../handlers/storage-handler'

const DEFAULT_DECISION_ID_COOKIE_EXPIRES = expiresInDays(30)
const DECISION_ID_QUERY_PARAM_NAME = 'li_did'
const DECISION_ID_COOKIE_NAMESPACE = 'lidids.'

const _onlyUnique = (value: string, index: number, self: string[]) => self.indexOf(value) === index
const _nonEmpty = (value: string) => value && trim(value).length > 0

export function resolve (state: State, storageHandler: StorageHandler, eventBus: EventBus): State {
  let ret = {}
  function _addDecisionId (key: string, cookieDomain?: string) {
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
    const freshDecisions = ([] as ParsedParam[]).concat((state.pageUrl && getQueryParameter(state.pageUrl, DECISION_ID_QUERY_PARAM_NAME)) || [])
    const storedDecisions = storageHandler.findSimilarCookies(DECISION_ID_COOKIE_NAMESPACE)
    freshDecisions
      .map(trim)
      .filter(_nonEmpty)
      .filter(isUUID)
      .filter(_onlyUnique)
      .forEach(decision => _addDecisionId(decision, state.domain))
    const allDecisions = freshDecisions
      .concat(storedDecisions)
      .map(trim)
      .filter(_nonEmpty)
      .filter(isUUID)
      .filter(_onlyUnique)
    ret = { decisionIds: allDecisions }
  } catch (e) {
    eventBus.emitErrorWithMessage('DecisionsResolve', 'Error while managing decision ids', e)
  }
  return ret
}
