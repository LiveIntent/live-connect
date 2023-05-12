import { StorageStrategy } from './model/storage-strategy'
import { UrlCollectionMode } from './model/url-collection-mode'
import { ErrorDetails, EventBus } from 'live-connect-common'

export interface IdentityResolutionConfig {
  url?: string
  expirationHours?: number
  ajaxTimeout?: number
  source?: string
  publisherId?: number
  requestedAttributes?: string[]
  contextSelectors?: string
  contextElementsLength?: number
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
}

export type ResolutionParams = Record<string, string | string[]>

// Object fields will be name and value of requested attributes
export type IdentityResolutionResult = object

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

export interface ILiveConnect {
  ready: boolean
  push: (event: unknown) => void
  fire: () => void
  resolve?: (
    successCallBack: (result: IdentityResolutionResult) => void,
    errorCallBack: () => void,
    additionalParams?: ResolutionParams
  ) => void
  resolutionCallUrl?: (additionalParams: ResolutionParams) => string
  peopleVerifiedId?: string
  config: LiveConnectConfig
  eventBus?: EventBus
}
