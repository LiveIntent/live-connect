export interface Cache {
    get: (key: any) => any
    set: (key: any, value: any) => void
}

export interface ErrorDetails {
    message: string,
    name: string,
    stackTrace?: string,
    lineNumber?: number,
    lineColumn?: number,
    fileName?: string
}

export interface ExternalMinimalStorageHandler {
    getCookie?: (key: string) => string | null,
    getDataFromLocalStorage?: (key: string) => string | null,
    localStorageIsEnabled?: () => boolean
}

export interface ExternalStorageHandler extends ExternalMinimalStorageHandler {
    get?: (key: string) => string | null,
    set?: (key: string, value: string, expires?: Date, sameSite?: string, domain?: string) => void,
    setCookie?: (key: string, value: string, expires?: Date, sameSite?: string, domain?: string) => void,
    setDataInLocalStorage?: (key: string, value: string) => void,
    removeDataFromLocalStorage?: (key: string) => void,
    findSimilarCookies?: (substring: string) => string[]
}

export interface IMinimalStorageHandler extends ExternalMinimalStorageHandler {
    getCookie: (key: string) => string | null,
    getDataFromLocalStorage: (key: string) => string | null,
    localStorageIsEnabled: () => boolean
}

export interface IStorageHandler extends IMinimalStorageHandler {
    get: (key: string) => string | null,
    set: (key: string, value: string, expires?: Date, sameSite?: string, domain?: string) => void,
    setCookie: (key: string, value: string, expires?: Date, sameSite?: string, domain?: string) => void,
    setDataInLocalStorage: (key: string, value: string) => void,
    removeDataFromLocalStorage: (key: string) => void,
    findSimilarCookies: (substring: string) => string[]
}

export interface ExternalCallHandler {
    ajaxGet?: (
        url: string,
        onSuccess: (responseText: string) => void,
        onError?: (error: any) => void,
        timeout?: number
    ) => void,
    pixelGet?: (
        url: string,
        onLoad?: () => void
    ) => void
}

export interface ICallHandler {
    ajaxGet: (
        url: string,
        onSuccess: (responseText: string) => void,
        onError?: (error: any) => void,
        timeout?: number
    ) => void,
    pixelGet: (
        url: string,
        onLoad?: () => void
    ) => void
}

export interface IIdentityResolver {
    resolve: (
        successCallBack: (result: IdentityResultionResult) => void,
        errorCallBack: () => void,
        additionalParams?: ResolutionParams
    ) => void,
    getUrl: (additionalParams: ResolutionParams) => string
}

export interface RetrievedIdentifier {
    name: string,
    value: string
}

export interface State extends LiveConnectConfig {
    eventSource?: object,
    liveConnectId?: string,
    trackerName?: string,
    pageUrl?: string,
    domain?: string,
    hashesFromIdentifiers?: HashedEmail[],
    decisionIds?: string[],
    peopleVerifiedId?: string,
    errorDetails?: ErrorDetails,
    retrievedIdentifiers?: RetrievedIdentifier[],
    hashedEmail?: HashedEmail[],
    providedHash?: string,
    gdprConsent?: string,
    contextSelectors?: string,
    contextElementsLength?: number,
    contextElements?: string,
    privacyMode?: boolean,
    referrer?: string
}

type ParamOrEmpty = [string, string][] | [string, string] | []

export interface HemStore {
    hashedEmail?: HashedEmail[]
}

export interface ConfigMatcher {
    appId: string[],
    wrapperName: string[],
    collectorUrl: string[]
}

export interface IdentityResolutionConfig {
    url?: string,
    expirationHours?: number,
    ajaxTimeout?: number,
    source?: string,
    publisherId?: number
    requestedAttributes?: string[],
    contextSelectors?: string,
    contextElementsLength?: number
}

export interface LiveConnectConfig {
    appId?: string,
    wrapperName?: string,
    storageStrategy?: StorageStrategyMode,
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

export interface ILiveConnect {
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

export interface HashedEmail {
    md5: string,
    sha1: string,
    sha256: string
}

export interface ReplayEmitter {
    on<C> (name: string, callback: (ctx: C, event: object) => void, ctx: C): ReplayEmitter,
    once<C> (name: string, callback: (ctx: C, event: object) => void, ctx: C): ReplayEmitter,
    emit (name: string, event: object): ReplayEmitter,
    off (name: string, callback: (ctx: any, event: object) => void): ReplayEmitter
}

export interface IQuery {
    prependParam (tuple: [string, string]): IQuery,
    toQueryString (): string
}

export interface IStateWrapper {
    data: State,
    sendsPixel (): boolean,
    combineWith (newInfo: State): IStateWrapper,
    asTuples (): [string, string][]
    asQuery (): IQuery,
  }

export interface IPixelSender {
    sendAjax (state: IStateWrapper): void,
    sendPixel (state: IStateWrapper): void,
}

export type StorageStrategyMode = 'cookie' | 'ls' | 'none' | 'disabled'
