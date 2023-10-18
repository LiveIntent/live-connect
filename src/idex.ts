import { base64UrlEncode } from './utils/b64'
import { toParams } from './utils/url'
import { expiresInHours, isFunction, isObject } from 'live-connect-common'
import { asParamOrEmpty, asStringParamWhen, asStringParam, mapAsParams } from './utils/params'
import { DEFAULT_IDEX_AJAX_TIMEOUT, DEFAULT_IDEX_EXPIRATION_HOURS, DEFAULT_IDEX_URL, DEFAULT_REQUESTED_ATTRIBUTES } from './utils/consts'
import { IdentityResolutionConfig, State, ResolutionParams, EventBus, RetrievedIdentifier } from './types'
import { WrappedCallHandler } from './handlers/call-handler'
import { DurableCache, NoOpCache } from './cache'

const IDEX_STORAGE_KEY = '__li_idex_cache2'

export type ResolutionMetadata = {
  expiresAt?: Date,
  resolvedAt: Date
}

export class IdentityResolver {
  eventBus: EventBus
  calls: WrappedCallHandler
  cache: DurableCache
  idexConfig: IdentityResolutionConfig
  externalIds: RetrievedIdentifier[]
  defaultExpirationHours: number
  source: string
  publisherId: number | string
  url: string
  timeout: number
  requestedAttributes: string[]
  tuples: [string, string][]

  private constructor (
    config: State,
    calls: WrappedCallHandler,
    cache: DurableCache,
    eventBus: EventBus
  ) {
    this.eventBus = eventBus
    this.calls = calls
    this.cache = cache
    this.idexConfig = config.identityResolutionConfig || {}
    this.externalIds = config.retrievedIdentifiers || []
    this.defaultExpirationHours = this.idexConfig.expirationHours || DEFAULT_IDEX_EXPIRATION_HOURS
    this.source = this.idexConfig.source || 'unknown'
    this.publisherId = this.idexConfig.publisherId || 'any'
    this.url = this.idexConfig.url || DEFAULT_IDEX_URL
    this.timeout = this.idexConfig.ajaxTimeout || config.ajaxTimeout || DEFAULT_IDEX_AJAX_TIMEOUT
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

  static make(
    config: State,
    cache: DurableCache,
    calls: WrappedCallHandler,
    eventBus: EventBus
  ): IdentityResolver {
    const nonNullConfig = config || { identityResolutionConfig: {} }
    return new IdentityResolver(nonNullConfig, calls, cache, eventBus)
  }

  static makeNoCache(config: State, calls: WrappedCallHandler, eventBus: EventBus): IdentityResolver {
    return IdentityResolver.make(config || {}, NoOpCache, calls, eventBus)
  }

  private getCached(key: string): [unknown, ResolutionMetadata] | null {
    const cachedValue = this.cache.get(cacheKey(key))
    if (cachedValue) {
      return [JSON.parse(cachedValue.data), { expiresAt: cachedValue.meta.expiresAt, resolvedAt: cachedValue.meta.writtenAt }]
    } else {
      return null
    }
  }

  private setCached(key: string, value: unknown, expiresAt?: Date) {
    this.cache.set(cacheKey(key), JSON.stringify(value), expiresAt || expiresInHours(this.defaultExpirationHours))
  }

  private responseReceived(
    idexPath: string,
    successCallback: (result: unknown, meta: ResolutionMetadata) => void
  ): ((responseText: string, response: unknown) => void) {
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
      const resolvedAt = new Date()
      this.setCached(idexPath, responseObj, expiresAt)
      successCallback(responseObj, { expiresAt, resolvedAt })
    }
  }

  unsafeResolve(successCallback: (result: unknown, meta: ResolutionMetadata) => void, errorCallback: (e: unknown) => void, additionalParams: ResolutionParams): void {
    const idexPath = this.buildPath(additionalParams)
    const cachedValue = this.getCached(idexPath)
    if (cachedValue) {
      successCallback(...cachedValue)
    } else {
      this.calls.ajaxGet(
        this.buildUrl(idexPath),
        this.responseReceived(idexPath, successCallback),
        errorCallback,
        this.timeout
      )
    }
  }

  getUrl(additionalParams: Record<string, string | string[]>): string {
    return this.buildUrl(this.buildPath(additionalParams))
  }

  resolve(successCallback: (result: unknown, meta: ResolutionMetadata) => void, errorCallback?: (e: unknown) => void, additionalParams?: ResolutionParams): void {
    try {
      this.unsafeResolve(successCallback, errorCallback || (() => {}), additionalParams || {})
    } catch (e) {
      console.error('IdentityResolve', e)
      if (errorCallback && isFunction(errorCallback)) {
        errorCallback(e)
      }
      if (this.eventBus) {
        this.eventBus.emitError('IdentityResolve', e)
      }
    }
  }

  private buildPath(additionalParams: Record<string, string | string[]>): string {
    const originalParams = this.tuples.slice().concat(mapAsParams(additionalParams))
    const params = toParams(originalParams)
    return `${this.source}/${this.publisherId}${params}`
  }

  private buildUrl(path: string): string {
    return `${this.url}/${path}`
  }
}

function responseExpires(response: unknown) {
  if (isObject(response) && 'getResponseHeader' in response && isFunction(response.getResponseHeader)) {
    const expiresHeader = response.getResponseHeader('expires')
    if (expiresHeader) {
      return new Date(expiresHeader)
    }
  }
}

function cacheKey(rawKey: string): string {
  const suffix = base64UrlEncode(JSON.stringify(rawKey))
  return `${IDEX_STORAGE_KEY}_${suffix}`
}
