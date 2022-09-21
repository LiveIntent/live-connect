import { fromError } from '../utils/emitter'
import { toParams } from '../utils/url'
import { asParamOrEmpty, asStringParamWhen, asStringParam, mapAsParams } from '../utils/types'
import { DEFAULT_IDEX_AJAX_TIMEOUT, DEFAULT_IDEX_URL, DEFAULT_REQUESTED_ATTRIBUTES } from '../utils/consts'
import { Cache } from './cache'
import { CallHandler } from '../handlers/call-handler'

// Object fields will be name and value of requested attributes
type IdentityResultionResult = object

// Parameters that are a list will be repeated.
// i.e. { 'resolve': ['a', 'b'] } => resolve=a&resolve=b
interface ResultionParams {
  [key: string]: string | string[]
}

export interface IdentityResolver {
  resolve: (
    successCallBack: (result: IdentityResultionResult) => void,
    errorCallBack: () => void,
    additionalParams?: ResultionParams
  ) => void,
  getUrl: (additionalParams: object) => string
}

export function makeIdentityResolver (config, calls: CallHandler, cache: Cache): IdentityResolver {
  try {
    const idexConfig = config.identityResolutionConfig || {}
    const externalIds = config.retrievedIdentifiers || []
    const source = idexConfig.source || 'unknown'
    const publisherId = idexConfig.publisherId || 'any'
    const url = idexConfig.url || DEFAULT_IDEX_URL
    const timeout = idexConfig.ajaxTimeout || DEFAULT_IDEX_AJAX_TIMEOUT
    const requestedAttributes = idexConfig.requestedAttributes || DEFAULT_REQUESTED_ATTRIBUTES

    const tuples = []
    tuples.push(asStringParam('duid', config.peopleVerifiedId))
    tuples.push(asStringParam('us_privacy', config.usPrivacyString))
    tuples.push(asParamOrEmpty('gdpr', config.gdprApplies, v => encodeURIComponent(v ? 1 : 0)))
    tuples.push(asStringParamWhen('n3pc', config.privacyMode ? 1 : 0, v => v === 1))
    tuples.push(asStringParam('gdpr_consent', config.gdprConsent))

    externalIds.forEach(retrievedIdentifier => {
      tuples.push(asStringParam(retrievedIdentifier.name, retrievedIdentifier.value))
    })

    const attributeResolutionAllowed = (attribute) => {
      if (attribute === 'uid2') {
        return !config.privacyMode
      } else {
        return true
      }
    }

    requestedAttributes.filter(attributeResolutionAllowed).forEach(requestedAttribute => {
      tuples.push(asStringParam('resolve', requestedAttribute))
    })

    const composeUrl = (additionalParams) => {
      const originalParams = tuples.slice().concat(mapAsParams(additionalParams))
      const params = toParams(originalParams)
      return `${url}/${source}/${publisherId}${params}`
    }

    const responseReceived = (additionalParams: object, successCallback: (result: any) => void): (response: string) => void => {
      return response => {
        let responseObj = {}
        if (response) {
          try {
            responseObj = JSON.parse(response)
          } catch (ex) {
            console.error('Error parsing response', ex)
            fromError('IdentityResolverParser', ex)
          }
        }
        cache.set(additionalParams, responseObj)
        successCallback(responseObj)
      }
    }

    const unsafeResolve = (
      successCallback: (result: IdentityResultionResult) => void,
      errorCallback: () => void,
      additionalParams?: ResultionParams
    ): void => {
      const cachedValue = cache.get(additionalParams)
      if (cachedValue) {
        // no need to enrich as the cached value was already enriched
        successCallback(cachedValue)
      } else {
        calls.ajaxGet(
          composeUrl(additionalParams),
          responseReceived(additionalParams, successCallback),
          errorCallback,
          timeout
        )
      }
    }

    return {
      resolve: (successCallback, errorCallback, additionalParams) => {
        try {
          unsafeResolve(successCallback, errorCallback, additionalParams)
        } catch (e) {
          console.error('IdentityResolve', e)
          errorCallback()
          fromError('IdentityResolve', e)
        }
      },
      getUrl: (additionalParams) => composeUrl(additionalParams)
    }
  } catch (e) {
    console.error('IdentityResolver', e)
    fromError('IdentityResolver', e)
    return {
      resolve: (successCallback, errorCallback, additionalParams) => {
        errorCallback()
        fromError('IdentityResolver.resolve', e)
      },
      getUrl: (additionalParams) => {
        fromError('IdentityResolver.getUrl', e)
        return null
      }
    }
  }
}
