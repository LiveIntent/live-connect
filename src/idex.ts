import { isFunction, isObject, isString, onNonNull } from 'live-connect-common'
import { QueryBuilder, encodeIdCookie } from './utils/query.js'
import { DEFAULT_IDEX_AJAX_TIMEOUT, DEFAULT_IDEX_URL, DEFAULT_REQUESTED_ATTRIBUTES } from './utils/consts.js'
import { IdentityResolutionConfig, State, ResolutionParams, EventBus, RetrievedIdentifier } from './types.js'
import { WrappedCallHandler } from './handlers/call-handler.js'
import { stripQueryAndPath } from './pixel/url-collector.js'

const ID_COOKIE_ATTR = 'idCookie'

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
  // Be careful, this object is mutable. In cases where temporary changes are needed
  // - e.g. adding parameters that are only valid for one single call - ensure to copy it
  query: QueryBuilder
  privacyMode: boolean
  resolvedIdCookie?: string | null
  generateIdCookie: boolean
  peopleVerifiedId?: string
  pageUrl?: string

  constructor (
    config: State,
    calls: WrappedCallHandler,
    eventBus: EventBus
  ) {
    const nonNullConfig: State = config || { identityResolutionConfig: {} }

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
    this.generateIdCookie = this.idexConfig.idCookieMode === 'generated'
    this.peopleVerifiedId = nonNullConfig.peopleVerifiedId
    this.pageUrl = nonNullConfig.pageUrl

    this.query = new QueryBuilder()
      .addOptional('duid', nonNullConfig.peopleVerifiedId)
      .addOptional('us_privacy', nonNullConfig.usPrivacyString)
      .addOptional('gdpr', onNonNull(nonNullConfig.gdprApplies, v => v ? 1 : 0))
      .addOptional('gdpr_consent', nonNullConfig.gdprConsent)
      .addOptional('did', nonNullConfig.distributorId)
      .addOptional('gpp_s', nonNullConfig.gppString)
      .addOptional('gpp_as', nonNullConfig.gppApplicableSections?.join(','))
      .addOptional('cd', nonNullConfig.cookieDomain)
      .addOptional('ic', encodeIdCookie(nonNullConfig.resolvedIdCookie), { stripEmpty: false })
      .addOptional('pu', onNonNull(nonNullConfig.pageUrl, stripQueryAndPath))

    this.externalIds.forEach(retrievedIdentifier => {
      this.query.add(retrievedIdentifier.name, retrievedIdentifier.value)
    })

    this.requestedAttributes.forEach(requestedAttribute => {
      this.query.add('resolve', requestedAttribute)
    })
  }

  private attributeResolutionAllowed(attribute: string): boolean {
    if (attribute === 'uid2') {
      return !this.privacyMode
    } else if (attribute === ID_COOKIE_ATTR) {
      // cannot be resolved server-side
      return false
    } else {
      return true
    }
  }

  private filterParams(query: QueryBuilder): QueryBuilder {
    return query.filteredCopy((key, value) => {
      if (key === 'resolve') {
        if (isString(value)) {
          return this.attributeResolutionAllowed(value)
        } else {
          return false
        }
      } else {
        return true
      }
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private enrichExtraIdentifiers(response: Record<any, any>, params: QueryBuilder): Record<any, any> {
    const requestedAttributes = params.tuples.filter(([key]) => key === 'resolve').map(([, value]) => value)

    function requested(attribute: string): boolean {
      return requestedAttributes.indexOf(attribute) > -1
    }

    const result = { ...response }

    if (requested(ID_COOKIE_ATTR)) {
      if (this.generateIdCookie && this.peopleVerifiedId) {
        result[ID_COOKIE_ATTR] = this.peopleVerifiedId
      } else if (this.resolvedIdCookie) {
        result[ID_COOKIE_ATTR] = this.resolvedIdCookie
      }
    }

    return result
  }

  private responseReceived(
    successCallback: (result: unknown, meta: ResolutionMetadata) => void,
    params: QueryBuilder
  ): ((responseText: string, response: unknown) => void) {
    return (responseText, response) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let responseObj: Record<any, any> = {}
      if (responseText) {
        try {
          const responseJson = JSON.parse(responseText)
          if (isObject(responseJson)) {
            responseObj = responseJson
          }
        } catch (ex) {
          console.error('Error parsing response', ex)
          this.eventBus.emitError('IdentityResolverParser', ex)
        }
      }

      const expiresAt = responseExpires(response)
      successCallback(this.enrichExtraIdentifiers(responseObj, params), { expiresAt })
    }
  }

  private buildUrl(query: QueryBuilder): string {
    return `${this.url}/${this.source}/${this.publisherId}${this.filterParams(query).toQueryString()}`
  }

  getUrl(additionalParams?: Record<string, string | string[]>): string {
    const params = this.query.copy().addParamsMap(additionalParams ?? {})
    return this.buildUrl(params)
  }

  resolve(successCallback: (result: unknown, meta: ResolutionMetadata) => void, errorCallback?: (e: unknown) => void, additionalParams?: ResolutionParams): void {
    try {
      const params = this.query.copy().addParamsMap(additionalParams ?? {})
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
