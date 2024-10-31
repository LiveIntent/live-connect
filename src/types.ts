import { DurableCache } from './cache.js'
import { WrappedStorageHandler } from './handlers/storage-handler.js'
import { ResolutionMetadata } from './idex.js'
import { StorageStrategy } from './model/storage-strategy.js'
import { UrlCollectionMode } from './model/url-collection-mode.js'
import { ErrorDetails } from 'live-connect-common'

export type Enricher<in In extends object, out Out extends object> =
  <ActualIn extends In> (state: ActualIn) => ActualIn & Out

export type ExtraIdexAttributes = {
  ipv4?: string
  ipv6?: string
}

export type IdentityResolutionConfig = {
  url?: string
  ajaxTimeout?: number
  source?: string
  publisherId?: number
  requestedAttributes?: string[],
  idCookieMode?: 'generated' | 'provided',
  extraAttributes?: ExtraIdexAttributes
}

export type IdCookieConfig = {
  strategy?: 'cookie' | 'localStorage'
  name?: string
}

export interface LiveConnectConfig {
  appId?: string
  wrapperName?: string
  storageStrategy?: StorageStrategy
  collectorUrl?: string
  usPrivacyString?: string
  gdprApplies?: boolean
  gdprConsent?: string
  expirationDays?: number
  identifiersToResolve?: string | string[]
  trackerVersion?: string
  identityResolutionConfig?: IdentityResolutionConfig
  distributorId?: string
  globalVarName?: string
  urlCollectionMode?: UrlCollectionMode
  queryParametersFilter?: string
  ajaxTimeout?: number
  contextSelectors?: string
  contextElementsLength?: number
  peopleVerifiedId?: string
  gppString?: string
  gppApplicableSections?: number[]
  idCookie?: IdCookieConfig
}

export type ResolutionParams = Record<string, string | string[]>

export type IdentityResultionResult = unknown

export interface HashedEmail {
  md5: string
  sha1: string
  sha256: string
}

export interface RetrievedIdentifier {
  name: string
  value: string
}

export interface State extends LiveConnectConfig {
  eventSource?: object
  liveConnectId?: string
  trackerVersion?: string
  pageUrl?: string
  domain?: string
  hashesFromIdentifiers?: HashedEmail[]
  decisionIds?: string[]
  peopleVerifiedId?: string
  errorDetails?: ErrorDetails
  retrievedIdentifiers?: RetrievedIdentifier[]
  providedHash?: string
  contextSelectors?: string
  contextElementsLength?: number
  contextElements?: string
  privacyMode?: boolean
  referrer?: string
  cookieDomain?: string
  resolvedIdCookie?: string | null // null signals failure to resolve,
}

export type FiddledExtraFields = {
  hashedEmail?: string[]
  providedIPV4?: string
  providedIPV6?: string
  providedUserAgent?: string,
  eventSource?: Record<string, unknown>
}

export type FiddledState = State & FiddledExtraFields
export interface ConfigMismatch {
  appId: (string | undefined)[]
  wrapperName: (string | undefined)[]
  collectorUrl: (string | undefined)[]
}

export interface ErrorBus {
  emitErrorWithMessage(name: string, message: string, e?: unknown): this
  emitError(name: string, exception?: unknown): this
}

export interface EventBus extends ErrorBus {
  on<F extends ((event: unknown) => void)>(name: string, callback: F, ctx?: ThisParameterType<F>): this
  once<F extends ((event: unknown) => void)>(name: string, callback: F, ctx?: ThisParameterType<F>): this
  emit(name: string, event: unknown): this
  off(name: string, callback: (event: unknown) => void): this
}

export interface PublicLiveConnect {
  push?: (...event: unknown[]) => void
  resolve?: (
    successCallBack: (result: IdentityResultionResult, meta: ResolutionMetadata) => void,
    errorCallBack: () => void,
    additionalParams?: ResolutionParams
  ) => void
}

export interface InternalLiveConnect extends PublicLiveConnect {
  ready?: boolean
  fire?: () => void
  resolutionCallUrl?: (additionalParams: ResolutionParams) => string
  peopleVerifiedId?: string
  config?: LiveConnectConfig
  eventBus?: EventBus,
  storageHandler?: WrappedStorageHandler,
  cache?: DurableCache,
}
