import { base64UrlEncode } from '../utils/b64'
import { toParams } from '../utils/url'
import { asParamOrEmpty, asStringParamWhen, asStringParam, expiresInHours, mapAsParams, isFunction, isObject } from '../utils/types'
import { DEFAULT_IDEX_AJAX_TIMEOUT, DEFAULT_IDEX_URL, DEFAULT_REQUESTED_ATTRIBUTES } from '../utils/consts'
import { Cache, IIdentityResolver, IdentityResolutionConfig, State, ResolutionParams, EventBus } from '../types'
import { StorageHandler } from '../handlers/storage-handler'
import { CallHandler } from '../handlers/call-handler'

export function storageHandlerBackedCache (defaultExpirationHours: number, domain: string | undefined, storageHandler: StorageHandler, eventBus: EventBus): Cache {
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

export function makeIdentityResolver (config: State, calls: CallHandler, cache: Cache, eventBus: EventBus): IIdentityResolver {
  const idexConfig: IdentityResolutionConfig = config.identityResolutionConfig || {}
  const externalIds = config.retrievedIdentifiers || []
  const source = idexConfig.source || 'unknown'
  const publisherId = idexConfig.publisherId || 'any'
  const url = idexConfig.url || DEFAULT_IDEX_URL
  const timeout = idexConfig.ajaxTimeout || DEFAULT_IDEX_AJAX_TIMEOUT
  const requestedAttributes = idexConfig.requestedAttributes || DEFAULT_REQUESTED_ATTRIBUTES


  const tuples: [string, string][] = []
  tuples.push(...asStringParam('duid', config.peopleVerifiedId))
  tuples.push(...asStringParam('us_privacy', config.usPrivacyString))
  tuples.push(...asParamOrEmpty('gdpr', config.gdprApplies, v => encodeURIComponent(v ? 1 : 0)))
  tuples.push(...asStringParamWhen('n3pc', config.privacyMode ? '1' : '0', v => v === '1'))
  tuples.push(...asStringParam('gdpr_consent', config.gdprConsent))
  tuples.push(...asStringParam('did', config.distributorId))

  externalIds.forEach(retrievedIdentifier => {
    tuples.push(...asStringParam(retrievedIdentifier.name, retrievedIdentifier.value))
  })

  const attributeResolutionAllowed = (attribute: string) => {
    if (attribute === 'uid2') {
      return !config.privacyMode
    } else {
      return true
    }
  }

  requestedAttributes.filter(attributeResolutionAllowed).forEach(requestedAttribute => {
    tuples.push(...asStringParam('resolve', requestedAttribute))
  })

  const composeUrl = (additionalParams: Record<string, string | string[]>) => {
    const originalParams = tuples.slice().concat(mapAsParams(additionalParams))
    const params = toParams(originalParams)
    return `${url}/${source}/${publisherId}${params}`
  }

  const responseReceived = (
    additionalParams: ResolutionParams,
    successCallback: (result: any) => void
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
        unsafeResolve(successCallback, errorCallback, additionalParams || {})
      } catch (e) {
        console.error('IdentityResolve', e)
        errorCallback()
        eventBus.emitError('IdentityResolve', e)
      }
    },
    getUrl: (additionalParams) => composeUrl(additionalParams)
  }
}

function responseExpires (response: unknown) {
  if (isObject(response) && 'getResponseHeader' in response && isFunction(response.getResponseHeader)) {
    const expiresHeader = response.getResponseHeader('expires')
    if (expiresHeader) {
      return new Date(expiresHeader)
    }
  }
}
