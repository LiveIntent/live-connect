import { toParams } from '../utils/url'
import { fromError } from '../utils/emitter'
import { expiresInHours, asParamOrEmpty, asStringParamWhen, asStringParam, mapAsParams } from '../utils/types'
import { DEFAULT_IDEX_EXPIRATION_HOURS, DEFAULT_IDEX_AJAX_TIMEOUT, DEFAULT_IDEX_URL } from '../utils/consts'
import { base64UrlEncode } from '../utils/b64'

const IDEX_STORAGE_KEY = '__li_idex_cache'

function _cacheKey (additionalParams) {
  if (additionalParams) {
    const suffix = base64UrlEncode(JSON.stringify(additionalParams))
    return `${IDEX_STORAGE_KEY}_${suffix}`
  } else {
    return IDEX_STORAGE_KEY
  }
}

function _responseReceived (storageHandler, domain, expirationHours, successCallback, additionalParams) {
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
    try {
      storageHandler.set(
        _cacheKey(additionalParams),
        JSON.stringify(responseObj),
        expiresInHours(expirationHours),
        domain)
    } catch (ex) {
      fromError('IdentityResolverStorage', ex)
    }
    successCallback(responseObj)
  }
}

/**
 * @param {State} config
 * @param {StorageHandler} storageHandler
 * @param {CallHandler} calls
 * @return {{resolve: function(successCallback: function, errorCallback: function, additionalParams: Object), getUrl: function(additionalParams: Object)}}
 * @constructor
 */
export function IdentityResolver (config, storageHandler, calls) {
  try {
    const nonNullConfig = config || {}
    const idexConfig = nonNullConfig.identityResolutionConfig || {}
    const externalIds = nonNullConfig.retrievedIdentifiers || []
    const expirationHours = idexConfig.expirationHours || DEFAULT_IDEX_EXPIRATION_HOURS
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
      const cachedValue = storageHandler.get(_cacheKey(additionalParams))
      if (cachedValue) {
        successCallback(JSON.parse(cachedValue))
      } else {
        calls.ajaxGet(composeUrl(additionalParams), _responseReceived(storageHandler, nonNullConfig.domain, expirationHours, successCallback, additionalParams), errorCallback, timeout)
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
