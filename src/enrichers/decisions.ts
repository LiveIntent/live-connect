import { getQueryParameter, ParsedParam } from '../utils/url'
import { trim, isUUID, expiresInDays } from 'live-connect-common'
import { Enricher, EventBus, State } from '../types'
import { WrappedStorageHandler } from '../handlers/storage-handler'

const DEFAULT_DECISION_ID_COOKIE_EXPIRES = expiresInDays(30)
const DECISION_ID_QUERY_PARAM_NAME = 'li_did'
const DECISION_ID_COOKIE_NAMESPACE = 'lidids.'

const _onlyUnique = (value: string, index: number, self: string[]) => self.indexOf(value) === index
const _nonEmpty = (value: string) => value && trim(value).length > 0

type Input = { storageHandler: WrappedStorageHandler, eventBus: EventBus, pageUrl?: string, domain: string }
type Output = { decisionIds: string[] }

export const enrichDecisionIds: Enricher<Input, Output> = state => {
  const { storageHandler, eventBus, pageUrl, domain } = state
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

  function _orElseEmtpy<A>(errorDescription: string, f: () => A[]): A[] {
    try {
      return f()
    } catch (e) {
      eventBus.emitErrorWithMessage('DecisionsResolve', errorDescription, e)
      return []
    }
  }

  const freshDecisions = _orElseEmtpy(
    'Error while extracting new decision ids',
    () => {
      const extractedFreshDecisions = ([] as ParsedParam[]).concat((pageUrl && getQueryParameter(pageUrl, DECISION_ID_QUERY_PARAM_NAME)) || [])
      return extractedFreshDecisions
        .map(trim)
        .filter(_nonEmpty)
        .filter(isUUID)
        .filter(_onlyUnique)
    }
  )

  const storedDecisions = _orElseEmtpy(
    'Error while retrieving stored decision ids',
    () => {
      const extractedStoredDecisions = storageHandler.findSimilarCookies(DECISION_ID_COOKIE_NAMESPACE)
      return extractedStoredDecisions.map(trim)
        .filter(_nonEmpty)
        .filter(isUUID)
        .filter(_onlyUnique)
    }
  )

  freshDecisions.forEach(decision => {
    try {
      _addDecisionId(decision, domain)
    } catch (e) {
      eventBus.emitErrorWithMessage('DecisionsResolve', 'Error while storing new decision id', e)
    }
  })

  return { ...state, decisionIds: freshDecisions.concat(storedDecisions).filter(_onlyUnique) }
}
