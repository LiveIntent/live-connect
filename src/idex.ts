import { toParams } from './utils/url'
import { isFunction, isObject } from 'live-connect-common'
import { asParamOrEmpty, asStringParamWhen, asStringParam, mapAsParams } from './utils/params'
import { DEFAULT_IDEX_AJAX_TIMEOUT, DEFAULT_IDEX_URL, DEFAULT_REQUESTED_ATTRIBUTES } from './utils/consts'
import { IdentityResolutionConfig, State, ResolutionParams, EventBus, RetrievedIdentifier } from './types'
import { WrappedCallHandler } from './handlers/call-handler'

export type ResolutionMetadata = {
  expiresAt?: Date
}

export class IdentityResolver {
  eventBus: EventBus
  calls: WrappedCallHandler
  idexConfig: IdentityResolutionConfig
  externalIds: RetrievedIdentifier[]
  source: string
  publisherId: number | string
  url: string
  timeout: number
  requestedAttributes: string[]
  tuples: [string, string][]

  constructor (
    config: State,
    calls: WrappedCallHandler,
    eventBus: EventBus
  ) {
    const nonNullConfig = config || { identityResolutionConfig: {} }

    this.eventBus = eventBus
    this.calls = calls
    this.idexConfig = nonNullConfig.identityResolutionConfig || {}
    this.externalIds = nonNullConfig.retrievedIdentifiers || []
    this.source = this.idexConfig.source || 'unknown'
    this.publisherId = this.idexConfig.publisherId || 'any'
    this.url = this.idexConfig.url || DEFAULT_IDEX_URL
    this.timeout = this.idexConfig.ajaxTimeout || nonNullConfig.ajaxTimeout || DEFAULT_IDEX_AJAX_TIMEOUT
    this.requestedAttributes = this.idexConfig.requestedAttributes || DEFAULT_REQUESTED_ATTRIBUTES
    this.tuples = []

    this.tuples.push(...asStringParam('duid', nonNullConfig.peopleVerifiedId))
    this.tuples.push(...asStringParam('us_privacy', nonNullConfig.usPrivacyString))
    this.tuples.push(...asParamOrEmpty('gdpr', nonNullConfig.gdprApplies, v => encodeURIComponent(v ? 1 : 0)))
    this.tuples.push(...asStringParamWhen('n3pc', nonNullConfig.privacyMode ? '1' : '0', v => v === '1'))
    this.tuples.push(...asStringParam('gdpr_consent', nonNullConfig.gdprConsent))
    this.tuples.push(...asStringParam('did', nonNullConfig.distributorId))
    this.tuples.push(...asStringParam('gpp_s', nonNullConfig.gppString))
    this.tuples.push(...asStringParam('gpp_as', nonNullConfig.gppApplicableSections?.join(',')))
    this.tuples.push(...asStringParam('cd', nonNullConfig.cookieDomain))

    this.externalIds.forEach(retrievedIdentifier => {
      this.tuples.push(...asStringParam(retrievedIdentifier.name, retrievedIdentifier.value))
    })

    const attributeResolutionAllowed = (attribute: string) => {
      if (attribute === 'uid2') {
        return !nonNullConfig.privacyMode
      } else {
        return true
      }
    }

    this.requestedAttributes.filter(attributeResolutionAllowed).forEach(requestedAttribute => {
      this.tuples.push(...asStringParam('resolve', requestedAttribute))
    })
  }

  private responseReceived(
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
      successCallback(responseObj, { expiresAt })
    }
  }

  unsafeResolve(successCallback: (result: unknown, meta: ResolutionMetadata) => void, errorCallback: (e: unknown) => void, additionalParams: ResolutionParams): void {
    this.calls.ajaxGet(
      this.getUrl(additionalParams),
      this.responseReceived(successCallback),
      errorCallback,
      this.timeout
    )
  }

  getUrl(additionalParams: Record<string, string | string[]>): string {
    const originalParams = this.tuples.slice().concat(mapAsParams(additionalParams))
    const params = toParams(originalParams)
    return `${this.url}/${this.source}/${this.publisherId}${params}`
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
}

function responseExpires(response: unknown): Date | undefined {
  if (isObject(response) && 'getResponseHeader' in response && isFunction(response.getResponseHeader)) {
    const expiresHeader = response.getResponseHeader('expires')
    if (expiresHeader) {
      return new Date(expiresHeader)
    }
  }
}
