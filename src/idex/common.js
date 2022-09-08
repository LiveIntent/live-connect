import { base64UrlEncode } from '../utils/b64'
import { fromError } from '../utils/emitter'
import { toParams } from '../utils/url'
import { asParamOrEmpty, asStringParamWhen, asStringParam, expiresInHours, mapAsParams } from '../utils/types'
import { DEFAULT_IDEX_AJAX_TIMEOUT, DEFAULT_IDEX_URL, DEFAULT_REQUESTED_ATTRIBUTES } from '../utils/consts'

/**
 * @typedef {Object} Cache
 * @property {function} [get]
 * @property {function} [set]
 */

/**
 * @return {Cache}
 */
export function storageHandlerBackedCache (expirationHours, domain, storageHandler) {
  const IDEX_STORAGE_KEY = '__li_idex_cache'

  function _cacheKey (additionalParams) {
    if (additionalParams) {
      const suffix = base64UrlEncode(JSON.stringify(additionalParams))
      return `${IDEX_STORAGE_KEY}_${suffix}`
    } else {
      return IDEX_STORAGE_KEY
    }
  }

  return {
    get: (key) => {
      return storageHandler.get(_cacheKey(key))
    },
    set: (key, value) => {
      try {
        storageHandler.set(
          _cacheKey(key),
          JSON.stringify(value),
          expiresInHours(expirationHours),
          domain
        )
      } catch (ex) {
        fromError('IdentityResolverStorage', ex)
      }
    }
  }
}

/**
 * @return {Cache}
 */
export function noopCache () {
  return {
    get: (key) => {
      return null
    },
    set: (key, value) => {

    }
  }
}

/**
 * @typedef {Object} IdentityResolver
 * @property {function} [resolve]
 */

/**
 * @param {State} config
 * @param {StorageHandler} storageHandler
 * @param {CallHandler} calls
 * @return {IdentityResolver}
 */
export function makeIdentityResolver (config, calls, cache) {
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

    const enrichUnifiedId = (response) => {
      if (response && response.nonId && !response.unifiedId) {
        response.unifiedId = response.nonId
        return response
      } else {
        return response
      }
    }

    const composeUrl = (additionalParams) => {
      const originalParams = tuples.slice().concat(mapAsParams(additionalParams))
      const params = toParams(originalParams)
      return `${url}/${source}/${publisherId}${params}`
    }

    const responseReceived = (additionalParams, successCallback) => {
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

    const unsafeResolve = (successCallback, errorCallback, additionalParams) => {
      const cachedValue = cache.get(additionalParams)
      if (cachedValue) {
        successCallback(enrichUnifiedId(JSON.parse(cachedValue)))
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
