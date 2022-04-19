import { toParams } from '../utils/url'
import { fromError } from '../utils/emitter'
import { asParamOrEmpty, asStringParamWhen, asStringParam, mapAsParams } from '../utils/types'
import { DEFAULT_IDEX_AJAX_TIMEOUT, DEFAULT_IDEX_URL } from '../utils/consts'

function _responseReceived (successCallback) {
  return response => {
    let responseObj = {}
    if (response) {
      try {
        responseObj = JSON.parse(response)
      } catch (ex) {
        fromError('IdentityResolverParser', ex)
      }
    }
    successCallback(responseObj)
  }
}

/**
 * @param {State} config
 * @param {CallHandler} calls
 * @return {{resolve: function(successCallback: function, errorCallback: function, additionalParams: Object), getUrl: function(additionalParams: Object)}}
 * @constructor
 */
export function IdentityResolver (config, calls) {
  try {
    const nonNullConfig = config || {}
    const idexConfig = nonNullConfig.identityResolutionConfig || {}
    const externalIds = nonNullConfig.retrievedIdentifiers || []
    const source = idexConfig.source || 'unknown'
    const publisherId = idexConfig.publisherId || 'any'
    const url = idexConfig.url || DEFAULT_IDEX_URL
    const timeout = idexConfig.ajaxTimeout || DEFAULT_IDEX_AJAX_TIMEOUT
    const tuples = []
    tuples.push(asStringParam('duid', nonNullConfig.peopleVerifiedId))
    tuples.push(asStringParam('us_privacy', nonNullConfig.usPrivacyString))
    tuples.push(asParamOrEmpty('gdpr', nonNullConfig.gdprApplies, v => encodeURIComponent(v ? 1 : 0)))
    tuples.push(asStringParamWhen('n3pc', nonNullConfig.privacyMode ? 1 : 0, v => v === 1))
    tuples.push(asStringParam('gdpr_consent', nonNullConfig.gdprConsent))
    externalIds.forEach(retrievedIdentifier => {
      tuples.push(asStringParam(retrievedIdentifier.name, retrievedIdentifier.value))
    })

    const composeUrl = (additionalParams) => {
      const originalParams = tuples.slice().concat(mapAsParams(additionalParams))
      const params = toParams(originalParams)
      return `${url}/${source}/${publisherId}${params}`
    }
    const unsafeResolve = (successCallback, errorCallback, additionalParams) => {
      calls.ajaxGet(composeUrl(additionalParams), _responseReceived(successCallback), errorCallback, timeout)
    }
    return {
      resolve: (successCallback, errorCallback, additionalParams) => {
        try {
          unsafeResolve(successCallback, errorCallback, additionalParams)
        } catch (e) {
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
      resolve: (successCallback, errorCallback) => {
        errorCallback()
        fromError('IdentityResolver.resolve', e)
      },
      getUrl: () => {
        fromError('IdentityResolver.getUrl', e)
      }
    }
  }
}
