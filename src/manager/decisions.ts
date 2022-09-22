import * as error from '../utils/emitter'
import { urlParams } from '../utils/url'
import { trim, isUUID, expiresInDays } from '../utils/types'
import { State } from '../pixel/state'
import { StorageHandler } from '../handlers/types'

const DEFAULT_DECISION_ID_COOKIE_EXPIRES: Date = expiresInDays(30)
const DECISION_ID_QUERY_PARAM_NAME: string = 'li_did'
const DECISION_ID_COOKIE_NAMESPACE: string = 'lidids.'

const _onlyUnique = (value: string, index: number, self: string[]) => self.indexOf(value) === index
const _validUuid = (value: string) => isUUID(value)
const _nonEmpty = (value: string) => value && trim(value).length > 0

/**
 * @param {State} state
 * @param {StorageHandler} storageHandler
 */
export function resolve (state: State, storageHandler: StorageHandler): State {
  console.log('decisions.resolve', state)
  let ret = {}
  function _addDecisionId (key: string, cookieDomain: string) {
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
