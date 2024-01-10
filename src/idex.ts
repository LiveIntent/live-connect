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
  privacyMode: boolean
  resolvedIdCookie: string | null

  constructor (
    config: State,
    calls: WrappedCallHandler,
    eventBus: EventBus
  ) {
    const nonNullConfig: State = config || { identityResolutionConfig: {}, resolvedIdCookie: null }

    this.eventBus = eventBus
    this.calls = calls
    this.idexConfig = nonNullConfig.identityResolutionConfig || {}
    this.externalIds = nonNullConfig.retrievedIdentifiers || []
    this.source = this.idexConfig.source || 'unknown'
    this.publisherId = this.idexConfig.publisherId || 'any'
    this.url = this.idexConfig.url || DEFAULT_IDEX_URL
    this.timeout = this.idexConfig.ajaxTimeout || nonNullConfig.ajaxTimeout || DEFAULT_IDEX_AJAX_TIMEOUT
    this.requestedAttributes = this.idexConfig.requestedAttributes || DEFAULT_REQUESTED_ATTRIBUTES
    this.privacyMode = nonNullConfig.privacyMode ?? false
    this.resolvedIdCookie = nonNullConfig.resolvedIdCookie
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

    this.requestedAttributes.forEach(requestedAttribute => {
      this.tuples.push(...asStringParam('resolve', requestedAttribute))
    })
  }

  private attributeResolutionAllowed(attribute: string): boolean {
    if (attribute === 'uid2') {
      return !this.privacyMode
    } else if (attribute === 'idcookie') {
      // cannot be resolved server-side
      return false
    } else {
      return true
    }
  }

  private filterParams(params: [string, string][]): [string, string][] {
    return params.filter(([key, value]) => {
      if (key === 'resolve') {
        return this.attributeResolutionAllowed(value)
      } else {
        return true
      }
    })
  }

  private enrichExtraIdentifiers<T extends object>(response: T, params: [string, string][]): T & { idcookie?: string } {
    const requestedAttributes = params.filter(([key]) => key === 'resolve').map(([, value]) => value)
    function requested(attribute: string): boolean {
      return requestedAttributes.indexOf(attribute) > -1
    }

    let result = response

    if (requested('idcookie') && this.resolvedIdCookie) {
      result = { ...result, idcookie: this.resolvedIdCookie }
    }

    return result
  }

  private responseReceived(
    successCallback: (result: unknown, meta: ResolutionMetadata) => void,
    params: [string, string][]
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
      successCallback(this.enrichExtraIdentifiers(responseObj, params), { expiresAt })
    }
  }

  private buildUrl(params: [string, string][]): string {
    return `${this.url}/${this.source}/${this.publisherId}${toParams(this.filterParams(params))}`
  }

  getUrl(additionalParams: Record<string, string | string[]>): string {
    const params = this.tuples.slice().concat(mapAsParams(additionalParams))
    return this.buildUrl(params)
  }

  resolve(successCallback: (result: unknown, meta: ResolutionMetadata) => void, errorCallback?: (e: unknown) => void, additionalParams?: ResolutionParams): void {
    try {
      const params = this.tuples.slice().concat(mapAsParams(additionalParams ?? {}))
      this.calls.ajaxGet(
        this.buildUrl(params),
        this.responseReceived(successCallback, params),
        errorCallback,
        this.timeout
      )
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
