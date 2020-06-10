import { get } from '../utils/ajax'
import { toParams } from '../utils/url'
import { error } from '../utils/emitter'
import { expiresInDays, isFunction, isObject } from '../utils/types'

const IDEX_STORAGE_KEY = '__li_idex_cache'
const DEFAULT_IDEX_URL = 'https://idx.liadm.com/idex'
const DEFAULT_EXPIRATION_DAYS = 1
const DEFAULT_AJAX_TIMEOUT = 1000

function _responseReceived (storageHandler, domain, expirationDays, successCallback) {
  return response => {
    let responseObj = {}
    if (response) {
      try {
        responseObj = JSON.parse(response)
      } catch (ex) {
        console.error('Error parsing response', ex)
        error('IdentityResolverParser', `Error parsing Idex response: ${response}`, ex)
      }
    }
    try {
      storageHandler.setCookie(
        IDEX_STORAGE_KEY,
        JSON.stringify(responseObj),
        expiresInDays(expirationDays),
        'Lax',
        domain)
    } catch (ex) {
      console.error('Error storing response to cookies', ex)
      error('IdentityResolverStorage', 'Error putting the Idex response in a cookie jar', ex)
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

/**
 * @param {State} config
 * @param {StorageHandler} storageHandler
 * @return {{resolve: function(callback: function, additionalParams: Object), getUrl: function(additionalParams: Object)}}
 * @constructor
 */
export function IdentityResolver (config, storageHandler) {
  const encodedOrNull = (value) => value && encodeURIComponent(value)
  const fallback = (successCallback) => {
    if (isFunction(successCallback)) {
      successCallback({}, undefined)
    }
  }
  try {
    const nonNullConfig = config || {}
    const idexConfig = nonNullConfig.identityResolutionConfig || {}
    const externalIds = nonNullConfig.retrievedIdentifiers || []
    const expirationDays = idexConfig.expirationDays || DEFAULT_EXPIRATION_DAYS
    const source = idexConfig.source || 'unknown'
    const publisherId = idexConfig.publisherId || 'any'
    const url = idexConfig.url || DEFAULT_IDEX_URL
    const timeout = idexConfig.ajaxTimeout || DEFAULT_AJAX_TIMEOUT
    const tuples = []
    tuples.push(['duid', encodedOrNull(nonNullConfig.peopleVerifiedId)])
    tuples.push(['us_privacy', encodedOrNull(nonNullConfig.usPrivacyString)])
    externalIds.forEach(retrievedIdentifier => {
      const key = encodedOrNull(retrievedIdentifier.name)
      const value = encodedOrNull(retrievedIdentifier.value)
      tuples.push([key, value])
    })

    const composeUrl = (additionalParams) => {
      const originalParams = tuples.slice().concat(_additionalParams(additionalParams))
      const params = toParams(originalParams)
      return `${url}/${source}/${publisherId}${params}`
    }
    const unsafeResolve = (successCallback, additionalParams) => {
      const finalUrl = composeUrl(additionalParams)
      const storedCookie = storageHandler.getCookie(IDEX_STORAGE_KEY)
      if (storedCookie) {
        successCallback(JSON.parse(storedCookie))
      } else {
        get(finalUrl, _responseReceived(storageHandler, nonNullConfig.domain, expirationDays, successCallback), () => fallback(successCallback), timeout)
      }
    }
    return {
      resolve: (callback, additionalParams) => {
        try {
          unsafeResolve(callback, additionalParams)
        } catch (e) {
          console.error('IdentityResolve', e)
          fallback(callback)
          error('IdentityResolve', 'Resolve threw an unhandled exception', e)
        }
      },
      getUrl: (additionalParams) => composeUrl(additionalParams)
    }
  } catch (e) {
    console.error('IdentityResolver', e)
    error('IdentityResolver', 'IdentityResolver not created', e)
    return {
      resolve: (successCallback) => {
        fallback(successCallback)
        error('IdentityResolver.resolve', 'Resolve called on an uninitialised IdentityResolver', e)
      },
      getUrl: () => {
        error('IdentityResolver.getUrl', 'getUrl called on an uninitialised IdentityResolver', e)
      }
    }
  }
}
