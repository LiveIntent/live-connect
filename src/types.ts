import { DurableCache } from './cache'
import { WrappedStorageHandler } from './handlers/storage-handler'
import { ResolutionMetadata } from './idex'
import { StorageStrategy } from './model/storage-strategy'
import { UrlCollectionMode } from './model/url-collection-mode'
import { ErrorDetails } from 'live-connect-common'

export type Enricher<in In extends object, out Out extends object> =
  <ActualIn extends In> (state: ActualIn) => ActualIn & Out

export interface IdentityResolutionConfig {
  url?: string
  ajaxTimeout?: number
  source?: string
  publisherId?: number
  requestedAttributes?: string[]
}

export interface ProvidedIdCookieConfig {
  mode: 'provided'
  strategy: 'cookie' | 'localStorage'
  name: string
}

export interface GeneratedIdCookieConfig {
  mode: 'generated'
}

export type IdCookieConfig = ProvidedIdCookieConfig | GeneratedIdCookieConfig

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
  hashedEmail?: string[]
  providedHash?: string
  contextSelectors?: string
  contextElementsLength?: number
  contextElements?: string
  privacyMode?: boolean
  referrer?: string
  cookieDomain?: string
  resolvedIdCookie: string | null
}

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
