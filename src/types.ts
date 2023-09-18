import { WrappedCallHandler } from './handlers/call-handler'
import { WrappedStorageHandler } from './handlers/storage-handler'
import { StorageStrategy } from './model/storage-strategy'
import { UrlCollectionMode } from './model/url-collection-mode'
import { ErrorDetails } from 'live-connect-common'

export type Enricher<in In extends object, out Out extends object> =
  <ActualIn extends In> (state: ActualIn) => ActualIn & Out

export interface IdentityResolutionConfig {
  url?: string
  expirationHours?: number
  ajaxTimeout?: number
  source?: string
  publisherId?: number
  requestedAttributes?: string[]
}

export interface LiveConnectConfig {
  appId?: string
  wrapperName?: string
  storageStrategy?: StorageStrategy
  collectorUrl?: string
  usPrivacyString?: string
  gdprApplies?: boolean
  expirationDays?: number
  identifiersToResolve?: string | string[]
  trackerName?: string
  identityResolutionConfig?: IdentityResolutionConfig
  distributorId?: string
  globalVarName?: string
  urlCollectionMode?: UrlCollectionMode
  queryParametersFilter?: string
  ajaxTimeout?: number,
  contextSelectors?: string
  contextElementsLength?: number
}

export type ResolutionParams = Record<string, string | string[]>

// Object fields will be name and value of requested attributes
export type IdentityResultionResult = object

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
  trackerName?: string
  pageUrl?: string
  domain?: string
  hashesFromIdentifiers?: HashedEmail[]
  decisionIds?: string[]
  peopleVerifiedId?: string
  errorDetails?: ErrorDetails
  retrievedIdentifiers?: RetrievedIdentifier[]
  hashedEmail?: HashedEmail[]
  providedHash?: string
  gdprConsent?: string
  contextSelectors?: string
  contextElementsLength?: number
  contextElements?: string
  privacyMode?: boolean
  referrer?: string
}

export interface HemStore {
  hashedEmail?: HashedEmail[]
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

export interface ILiveConnect {
  ready: boolean
  push: (event: unknown) => void
  fire: () => void
  resolve?: (
    successCallBack: (result: IdentityResultionResult, expiresAt: Date) => void,
    errorCallBack: () => void,
    additionalParams?: ResolutionParams
  ) => void
  resolutionCallUrl?: (additionalParams: ResolutionParams) => string
  peopleVerifiedId?: string
  config: LiveConnectConfig
  eventBus?: EventBus,
  callHandler?: WrappedCallHandler,
  storageHandler?: WrappedStorageHandler,
}
