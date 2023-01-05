import { base64UrlEncode } from '../utils/b64'
import { toParams } from '../utils/url'
import { asParamOrEmpty, asStringParamWhen, asStringParam, expiresInHours, mapAsParams, isFunction } from '../utils/types'
import { DEFAULT_IDEX_AJAX_TIMEOUT, DEFAULT_IDEX_URL, DEFAULT_REQUESTED_ATTRIBUTES } from '../utils/consts'
import { IStorageHandler, Cache, IIdentityResolver, ICallHandler, IdentityResolutionConfig, State, ResolutionParams } from '../types'

<<<<<<< HEAD:src/idex/common.ts
export function storageHandlerBackedCache (defaultExpirationHours: number, domain: string, storageHandler: IStorageHandler): Cache {
=======
/**
 * @typedef {Object} Cache
 * @property {function} [get]
 * @property {function} [set]
 */

/**
 * @return {Cache}
 */
export function storageHandlerBackedCache (defaultExpirationHours, domain, storageHandler, eventBus) {
>>>>>>> master:src/idex/common.js
  const IDEX_STORAGE_KEY = '__li_idex_cache'

  function _cacheKey (rawKey: any) {
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
        eventBus.emitError('IdentityResolverStorage', ex)
      }
    }
  }
}

export const noopCache: Cache = {
  get: () => null,
  set: () => undefined
}

<<<<<<< HEAD:src/idex/common.ts
export function makeIdentityResolver (config: State, calls: ICallHandler, cache: Cache): IIdentityResolver {
=======
/**
 * @typedef {Object} IdentityResolver
 * @property {function} [resolve]
 */

/**
 * @param {State} config
 * @param {CallHandler} calls
 * @param {EventBus} eventBus
 * @param {Cache} cache
 * @return {IdentityResolver}
 */
export function makeIdentityResolver (config, calls, cache, eventBus) {
>>>>>>> master:src/idex/common.js
  try {
    const idexConfig: IdentityResolutionConfig = config.identityResolutionConfig || {}
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
    tuples.push(asStringParamWhen('n3pc', config.privacyMode ? '1' : '0', v => v === '1'))
    tuples.push(asStringParam('gdpr_consent', config.gdprConsent))
    tuples.push(asStringParam('did', config.distributorId))

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

    const responseReceived = (
      additionalParams: ResolutionParams,
      successCallback: (result: object) => void
    ): ((responseText: string, response: any) => void) => {
      return (responseText, response) => {
        let responseObj = {}
        if (responseText) {
          try {
            responseObj = JSON.parse(responseText)
          } catch (ex) {
            console.error('Error parsing response', ex)
            eventBus.emitError('IdentityResolverParser', ex)
          }
        }

        const expiresAt = responseExpires(response)

        cache.set(additionalParams, responseObj, expiresAt)
        successCallback(responseObj)
      }
    }

    const unsafeResolve = (successCallback: (result: object) => void, errorCallback: () => void, additionalParams: ResolutionParams) => {
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
          eventBus.emitError('IdentityResolve', e)
        }
      },
      getUrl: (additionalParams) => composeUrl(additionalParams)
    }
  } catch (e) {
    console.error('IdentityResolver', e)
    eventBus.emitError('IdentityResolver', e)
    return {
      resolve: (successCallback, errorCallback) => {
        errorCallback()
        eventBus.emitError('IdentityResolver.resolve', e)
      },
      getUrl: () => {
<<<<<<< HEAD:src/idex/common.ts
        fromError('IdentityResolver.getUrl', e)
        return undefined
=======
        eventBus.emitError('IdentityResolver.getUrl', e)
>>>>>>> master:src/idex/common.js
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
