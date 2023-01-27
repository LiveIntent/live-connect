import { base64UrlEncode } from './utils/b64'
import { toParams } from './utils/url'
import { asParamOrEmpty, asStringParamWhen, asStringParam, expiresInHours, mapAsParams, isFunction, isObject } from './utils/types'
import { DEFAULT_IDEX_AJAX_TIMEOUT, DEFAULT_IDEX_EXPIRATION_HOURS, DEFAULT_IDEX_URL, DEFAULT_REQUESTED_ATTRIBUTES } from './utils/consts'
import { IdentityResolutionConfig, State, ResolutionParams, EventBus, RetrievedIdentifier } from './types'
import { StorageHandler } from './handlers/storage-handler'
import { CallHandler } from './handlers/call-handler'

interface Cache {
  get: (key: any) => any
  set: (key: any, value: any, expiration?: Date) => void
}

function storageHandlerBackedCache (defaultExpirationHours: number, domain: string | undefined, storageHandler: StorageHandler, eventBus: EventBus): Cache {
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

const noopCache: Cache = {
  get: () => null,
  set: () => undefined
}

export class IdentityResolver {
  eventBus: EventBus
  calls: CallHandler
  cache: Cache
  idexConfig: IdentityResolutionConfig
  externalIds: RetrievedIdentifier[]
  source: string
  publisherId: number | string
  url: string
  timeout: number
  requestedAttributes: string[]
  tuples: [string, string][]

  private constructor (config: State, calls: CallHandler, cache: Cache, eventBus: EventBus) {
    this.eventBus = eventBus
    this.calls = calls
    this.cache = cache
    this.idexConfig = config.identityResolutionConfig || {}
    this.externalIds = config.retrievedIdentifiers || []
    this.source = this.idexConfig.source || 'unknown'
    this.publisherId = this.idexConfig.publisherId || 'any'
    this.url = this.idexConfig.url || DEFAULT_IDEX_URL
    this.timeout = this.idexConfig.ajaxTimeout || DEFAULT_IDEX_AJAX_TIMEOUT
    this.requestedAttributes = this.idexConfig.requestedAttributes || DEFAULT_REQUESTED_ATTRIBUTES
    this.tuples = []

    this.tuples.push(...asStringParam('duid', config.peopleVerifiedId))
    this.tuples.push(...asStringParam('us_privacy', config.usPrivacyString))
    this.tuples.push(...asParamOrEmpty('gdpr', config.gdprApplies, v => encodeURIComponent(v ? 1 : 0)))
    this.tuples.push(...asStringParamWhen('n3pc', config.privacyMode ? '1' : '0', v => v === '1'))
    this.tuples.push(...asStringParam('gdpr_consent', config.gdprConsent))
    this.tuples.push(...asStringParam('did', config.distributorId))

    this.externalIds.forEach(retrievedIdentifier => {
      this.tuples.push(...asStringParam(retrievedIdentifier.name, retrievedIdentifier.value))
    })

    const attributeResolutionAllowed = (attribute: string) => {
      if (attribute === 'uid2') {
        return !config.privacyMode
      } else {
        return true
      }
    }

    this.requestedAttributes.filter(attributeResolutionAllowed).forEach(requestedAttribute => {
      this.tuples.push(...asStringParam('resolve', requestedAttribute))
    })
  }

  static make (config: State, storageHandler: StorageHandler, calls: CallHandler, eventBus: EventBus): IdentityResolver {
    const nonNullConfig = config || {}
    const idexConfig = nonNullConfig.identityResolutionConfig || {}
    const expirationHours = idexConfig.expirationHours || DEFAULT_IDEX_EXPIRATION_HOURS
    const domain = nonNullConfig.domain

    const cache = storageHandlerBackedCache(expirationHours, domain, storageHandler, eventBus)
    return new IdentityResolver(nonNullConfig, calls, cache, eventBus)
  }

  static makeNoCache (config: State, calls: CallHandler, eventBus: EventBus): IdentityResolver {
    return new IdentityResolver(config || {}, calls, noopCache, eventBus)
  }

  private responseReceived (
    additionalParams: ResolutionParams,
    successCallback: (result: any) => void
  ): ((responseText: string, response: any) => void) {
    return (responseText, response) => {
      let responseObj = {}
      if (responseText) {
        try {
          responseObj = JSON.parse(responseText)
        } catch (ex) {
          console.error('Error parsing response', ex)
          this.eventBus.emitError('IdentityResolverParser', ex)
        }
      }

      const expiresAt = responseExpires(response)

      this.cache.set(additionalParams, responseObj, expiresAt)
      successCallback(responseObj)
    }
  }

  unsafeResolve (successCallback: (result: object) => void, errorCallback: () => void, additionalParams: ResolutionParams): void {
    const cachedValue = this.cache.get(additionalParams)
    if (cachedValue) {
      successCallback(cachedValue)
    } else {
      this.calls.ajaxGet(
        this.getUrl(additionalParams),
        this.responseReceived(additionalParams, successCallback),
        errorCallback,
        this.timeout
      )
    }
  }

  getUrl (additionalParams: Record<string, string | string[]>): string {
    const originalParams = this.tuples.slice().concat(mapAsParams(additionalParams))
    const params = toParams(originalParams)
    return `${this.url}/${this.source}/${this.publisherId}${params}`
  }

  resolve (successCallback: (result: object) => void, errorCallback: () => void, additionalParams?: ResolutionParams): void {
    try {
      this.unsafeResolve(successCallback, errorCallback, additionalParams || {})
    } catch (e) {
      console.error('IdentityResolve', e)
      errorCallback()
      if (this.eventBus) {
        this.eventBus.emitError('IdentityResolve', e)
      }
    }
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
