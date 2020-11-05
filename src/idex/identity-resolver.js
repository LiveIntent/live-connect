import { toParams } from '../utils/url'
import { fromError } from '../utils/emitter'
import { expiresInHours, isNonEmpty, isObject } from '../utils/types'
import { DEFAULT_IDEX_EXPIRATION_HOURS, DEFAULT_IDEX_AJAX_TIMEOUT, DEFAULT_IDEX_URL } from '../utils/consts'

const IDEX_STORAGE_KEY = '__li_idex_cache'

function _responseReceived (storageHandler, domain, expirationHours, successCallback) {
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
      storageHandler.setCookie(
        IDEX_STORAGE_KEY,
        JSON.stringify(responseObj),
        expiresInHours(expirationHours),
        'Lax',
        domain)
    } catch (ex) {
      console.error('Error storing response to cookies', ex)
      fromError('IdentityResolverStorage', ex)
    }
    successCallback(responseObj)
  }
}

const _additionalParams = (params) => {
  if (params && isObject(params)) {
    const array = []
    Object.keys(params).forEach((key) => {
      const value = params[key]
      if (value && !isObject(value) && value.length) {
        array.push([encodeURIComponent(key), encodeURIComponent(value)])
      }
    })
    return array
  } else {
    return []
  }
}

function _asParamOrEmpty (param, value, transform) {
  if (isNonEmpty(value)) {
    return [param, transform(value)]
  } else {
    return []
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
    tuples.push(_asParamOrEmpty('duid', nonNullConfig.peopleVerifiedId, encodeURIComponent))
    tuples.push(_asParamOrEmpty('us_privacy', nonNullConfig.usPrivacyString, encodeURIComponent))
    tuples.push(_asParamOrEmpty('gdpr', nonNullConfig.gdprApplies, v => encodeURIComponent(v ? 1 : 0)))
    tuples.push(_asParamOrEmpty('gdpr_consent', nonNullConfig.gdprConsent, encodeURIComponent))
    externalIds.forEach(retrievedIdentifier => {
      tuples.push(_asParamOrEmpty(retrievedIdentifier.name, retrievedIdentifier.value, encodeURIComponent))
    })

    const composeUrl = (additionalParams) => {
      const originalParams = tuples.slice().concat(_additionalParams(additionalParams))
      const params = toParams(originalParams)
      return `${url}/${source}/${publisherId}${params}`
    }
    const unsafeResolve = (successCallback, errorCallback, additionalParams) => {
      const storedCookie = storageHandler.getCookie(IDEX_STORAGE_KEY)
      if (storedCookie) {
        successCallback(JSON.parse(storedCookie))
      } else {
        calls.ajaxGet(composeUrl(additionalParams), _responseReceived(storageHandler, nonNullConfig.domain, expirationHours, successCallback), errorCallback, timeout)
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
