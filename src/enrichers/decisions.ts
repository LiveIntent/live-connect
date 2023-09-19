import { Enricher, EventBus } from '../types'
import { getQueryParameter, ParsedParam } from '../utils/url'
import { trim, isUUID, expiresInDays } from 'live-connect-common'
import { WrappedStorageHandler } from '../handlers/storage-handler'

type Input = { pageUrl?: string, domain: string }
type Output = { decisionIds: string[] }

const DEFAULT_DECISION_ID_COOKIE_EXPIRES = expiresInDays(30)
const DECISION_ID_QUERY_PARAM_NAME = 'li_did'
const DECISION_ID_COOKIE_NAMESPACE = 'lidids.'

const _onlyUnique = (value: string, index: number, self: string[]) => self.indexOf(value) === index
const _nonEmpty = (value: string) => value && trim(value).length > 0

export function enrichDecisionIds(
  storageHandler: WrappedStorageHandler,
  eventBus: EventBus
): Enricher<Input, Output> {
  return state => {
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

    function _orElseEmpty<A>(errorDescription: string, f: () => A[]): A[] {
      try {
        return f()
      } catch (e) {
        eventBus.emitErrorWithMessage('DecisionsResolve', errorDescription, e)
        return []
      }
    }

    const freshDecisions = _orElseEmpty(
      'Error while extracting new decision ids',
      () => {
        const extractedFreshDecisions = ([] as ParsedParam[]).concat((state.pageUrl && getQueryParameter(state.pageUrl, DECISION_ID_QUERY_PARAM_NAME)) || [])
        return extractedFreshDecisions
          .map(trim)
          .filter(_nonEmpty)
          .filter(isUUID)
          .filter(_onlyUnique)
      }
    )

    const storedDecisions = _orElseEmpty(
      'Error while retrieving stored decision ids',
      () => {
        const extractedStoredDecisions = storageHandler.findSimilarCookies(DECISION_ID_COOKIE_NAMESPACE)
        return extractedStoredDecisions
          .map(trim)
          .filter(_nonEmpty)
          .filter(isUUID)
      }
    )

    freshDecisions.forEach(decision => {
      try {
        _addDecisionId(decision, state.domain)
      } catch (e) {
        eventBus.emitErrorWithMessage('DecisionsResolve', 'Error while storing new decision id', e)
      }
    })

    return { ...state, decisionIds: freshDecisions.concat(storedDecisions).filter(_onlyUnique) }
  }
}
