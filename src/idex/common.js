import { base64UrlEncode } from '../utils/b64'
import { toParams } from '../utils/url'
import { asParamOrEmpty, asStringParamWhen, asStringParam, expiresInHours, mapAsParams, isFunction } from '../utils/types'
import { DEFAULT_IDEX_AJAX_TIMEOUT, DEFAULT_IDEX_URL, DEFAULT_REQUESTED_ATTRIBUTES } from '../utils/consts'

/**
 * @typedef {Object} Cache
 * @property {function} [get]
 * @property {function} [set]
 */

/**
 * @return {Cache}
 */
export function storageHandlerBackedCache (defaultExpirationHours, domain, storageHandler, messageBus) {
  const IDEX_STORAGE_KEY = '__li_idex_cache'

  function _cacheKey (rawKey) {
    if (rawKey) {
      const suffix = base64UrlEncode(JSON.stringify(rawKey))
      return `${IDEX_STORAGE_KEY}_${suffix}`
    } else {
      return IDEX_STORAGE_KEY
    }
  }

  return {
    get: (key) => {
      const cachedValue = storageHandler.get(_cacheKey(key))
      if (cachedValue) {
        return JSON.parse(cachedValue)
      } else {
        return cachedValue
      }
    },
    set: (key, value, expiresAt) => {
      try {
        storageHandler.set(
          _cacheKey(key),
          JSON.stringify(value),
          expiresAt || expiresInHours(defaultExpirationHours),
          domain
        )
      } catch (ex) {
        messageBus.encodeEmitError('IdentityResolverStorage', ex)
      }
    }
  }
}

/**
 * @type {Cache}
 */
export const noopCache = {
  get: (key) => null,
  set: (key, value, expiresAt) => undefined
}

/**
 * @typedef {Object} IdentityResolver
 * @property {function} [resolve]
 */

/**
 * @param {State} config
 * @param {CallHandler} calls
 * @param {Cache} cache
 * @return {IdentityResolver}
 */
export function makeIdentityResolver (config, calls, cache, messageBus) {
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

    const responseReceived = (additionalParams, successCallback) => {
      return (responseText, response) => {
        let responseObj = {}
        if (responseText) {
          try {
            responseObj = JSON.parse(responseText)
          } catch (ex) {
            console.error('Error parsing response', ex)
            messageBus.encodeEmitError('IdentityResolverParser', ex)
          }
        }

        const expiresAt = responseExpires(response)

        cache.set(additionalParams, responseObj, expiresAt)
        successCallback(responseObj)
      }
    }

    const unsafeResolve = (successCallback, errorCallback, additionalParams) => {
      const cachedValue = cache.get(additionalParams)
      if (cachedValue) {
        successCallback(cachedValue)
      } else {
        calls.ajaxGet(
          composeUrl(additionalParams),
          responseReceived(additionalParams, successCallback),
          errorCallback,
          timeout)
      }
    }

    return {
      resolve: (successCallback, errorCallback, additionalParams) => {
        try {
          unsafeResolve(successCallback, errorCallback, additionalParams)
        } catch (e) {
          console.error('IdentityResolve', e)
          errorCallback()
          messageBus.encodeEmitError('IdentityResolve', e)
        }
      },
      getUrl: (additionalParams) => composeUrl(additionalParams)
    }
  } catch (e) {
    console.error('IdentityResolver', e)
    messageBus.encodeEmitError('IdentityResolver', e)
    return {
      resolve: (successCallback, errorCallback) => {
        errorCallback()
        messageBus.encodeEmitError('IdentityResolver.resolve', e)
      },
      getUrl: () => {
        messageBus.encodeEmitError('IdentityResolver.getUrl', e)
      }
    }
  }
}

function responseExpires (response) {
  if (response && isFunction(response.getResponseHeader)) {
    const expiresHeader = response.getResponseHeader('expires')
    if (expiresHeader) {
      return new Date(expiresHeader)
    }
  }
}
