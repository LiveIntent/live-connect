import { getQueryParameter, ParsedParam } from '../utils/url'
import { trim, isUUID, expiresInDays } from 'live-connect-common'
import { EventBus, State } from '../types'
import { WrappedStorageHandler } from '../handlers/storage-handler'

const DEFAULT_DECISION_ID_COOKIE_EXPIRES = expiresInDays(30)
const DECISION_ID_QUERY_PARAM_NAME = 'li_did'
const DECISION_ID_COOKIE_NAMESPACE = 'lidids.'

const _onlyUnique = (value: string, index: number, self: string[]) => self.indexOf(value) === index
const _nonEmpty = (value: string) => value && trim(value).length > 0

export function resolve(state: State, storageHandler: WrappedStorageHandler, eventBus: EventBus): State {
  let ret = {}
  function _addDecisionId(key: string, cookieDomain?: string) {
    if (key) {
      storageHandler.setCookie(
        `${DECISION_ID_COOKIE_NAMESPACE}${key}`,
        key,
        DEFAULT_DECISION_ID_COOKIE_EXPIRES,
        'Lax',
        cookieDomain)
    }
  }

  let freshDecisions = [] as string[]
  try {
    const extractedFreshDecisions = ([] as ParsedParam[]).concat((state.pageUrl && getQueryParameter(state.pageUrl, DECISION_ID_QUERY_PARAM_NAME)) || [])
    freshDecisions = extractedFreshDecisions
      .map(trim)
      .filter(_nonEmpty)
      .filter(isUUID)
      .filter(_onlyUnique)
  } catch (e) {
    eventBus.emitErrorWithMessage('DecisionsResolve', 'Error while extracting new decision ids', e)
  }

  try {
    freshDecisions.forEach(decision => _addDecisionId(decision, state.domain))
  } catch (e) {
    eventBus.emitErrorWithMessage('DecisionsResolve', 'Error while storing new decision ids', e)
  }

  let storedDecisions = [] as string[]
  try {
    const extractedStoredDecisions = storageHandler.findSimilarCookies(DECISION_ID_COOKIE_NAMESPACE)
    storedDecisions = extractedStoredDecisions.map(trim)
      .filter(_nonEmpty)
      .filter(isUUID)
      .filter(_onlyUnique)
  } catch (e) {
    eventBus.emitErrorWithMessage('DecisionsResolve', 'Error while retrieving stored decision ids', e)
  }

  try {
    const allDecisions = freshDecisions
      .concat(storedDecisions)
      .filter(_onlyUnique)

    ret = { decisionIds: allDecisions }
  } catch (e) {
    eventBus.emitErrorWithMessage('DecisionsResolve', 'Error while managing decision ids', e)
  }

  return ret
}
