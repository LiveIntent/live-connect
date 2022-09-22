import { StorageStrategy } from './model/storage-strategy'

export interface IdentityResolutionConfig{
    url?: string,
    expirationHours?: number,
    ajaxTimeout?:number,
    source: string,
    publisherId: number
    requestedAttributes: string[],
    contextSelectors: string,
    contextElementsLength: number
}
export interface LiveConnectConfig {
    appId?: string,
    wrapperName?: string,
    storageStrategy?: StorageStrategy,
    collectorUrl?: string,
    usPrivacyString?: string,
    gdprApplies?: boolean,
    expirationDays?: number,
    identifiersToResolve?: string | string[],
    trackerName?: string,
    identityResolutionConfig?: IdentityResolutionConfig,
}

export type ResolutionParams = Record<string, string | string[]>

// Object fields will be name and value of requested attributes
export type IdentityResultionResult = object

export interface LiveConnect {
    ready?: boolean,
    push?: (event: object) => void,
    fire?: () => void,
    resolve?: (
        successCallBack: (result: IdentityResultionResult) => void,
        errorCallBack: () => void,
        additionalParams?: ResolutionParams
    ) => void,
    resolutionCallUrl?: (additionalParams: ResolutionParams) => string,
    peopleVerifiedId?: string,
    config?: LiveConnectConfig,
}
