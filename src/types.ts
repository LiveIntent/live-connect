import { StorageStrategy } from './model/storage-strategy'

export interface ErrorDetails extends Error {
    stackTrace?: string;
    lineNumber?: number;
    columnNumber?: number;
    fileName?: string;
}

export interface ExternalMinimalStorageHandler {
    getCookie?: (key: string) => string | null;
    getDataFromLocalStorage?: (key: string) => string | null;
    localStorageIsEnabled?: () => boolean;
}

export interface ExternalStorageHandler extends ExternalMinimalStorageHandler {
    setCookie?: (key: string, value: string, expires?: Date, sameSite?: string, domain?: string) => void;
    setDataInLocalStorage?: (key: string, value: string) => void;
    removeDataFromLocalStorage?: (key: string) => void;
    findSimilarCookies?: (substring: string) => string[];
}

export interface IdentityResolutionConfig {
    url?: string;
    expirationHours?: number;
    ajaxTimeout?: number;
    source?: string;
    publisherId?: number;
    requestedAttributes?: string[];
    contextSelectors?: string;
    contextElementsLength?: number;
}

export interface LiveConnectConfig {
    appId?: string;
    wrapperName?: string;
    storageStrategy?: StorageStrategy;
    collectorUrl?: string;
    usPrivacyString?: string;
    gdprApplies?: boolean;
    expirationDays?: number;
    identifiersToResolve?: string | string[];
    trackerName?: string;
    identityResolutionConfig?: IdentityResolutionConfig;
    distributorId?: string;
    globalVarName?: string;
}

export type ResolutionParams = Record<string, string | string[]>

// Object fields will be name and value of requested attributes
export type IdentityResultionResult = object
export interface ExternalCallHandler {
    ajaxGet?: (
        url: string,
        onSuccess: (responseText: string, response: unknown) => void,
        onError?: (error: unknown) => void,
        timeout?: number
    ) => void;
    pixelGet?: (
        url: string,
        onLoad?: () => void
    ) => void;
}

export interface HashedEmail {
    md5: string;
    sha1: string;
    sha256: string;
}

export interface RetrievedIdentifier {
    name: string;
    value: string;
}

export interface State extends LiveConnectConfig {
    eventSource?: object;
    liveConnectId?: string;
    trackerName?: string;
    pageUrl?: string;
    domain?: string;
    hashesFromIdentifiers?: HashedEmail[];
    decisionIds?: string[];
    peopleVerifiedId?: string;
    errorDetails?: ErrorDetails;
    retrievedIdentifiers?: RetrievedIdentifier[];
    hashedEmail?: HashedEmail[];
    providedHash?: string;
    gdprConsent?: string;
    contextSelectors?: string;
    contextElementsLength?: number;
    contextElements?: string;
    privacyMode?: boolean;
    referrer?: string;
}

export interface HemStore {
    hashedEmail?: HashedEmail[];
}

export interface ConfigMismatch {
    appId: (string | undefined)[];
    wrapperName: (string | undefined)[];
    collectorUrl: (string | undefined)[];
}

export interface ErrorBus {
    emitErrorWithMessage (name: string, message: string, e?: any): this;
    emitError (name: string, exception?: any): this;
}

export interface EventBus extends ErrorBus {
    on (name: string, callback: (event: any) => void, ctx?: any): this;
    once (name: string, callback: (event: any) => void, ctx?: any): this;
    emit (name: string, event: any): this;
    off (name: string, callback: (event: any) => void): this;
}

export interface ILiveConnect {
    ready: boolean;
    push: (event: any) => void;
    fire: () => void;
    resolve?: (
        successCallBack: (result: IdentityResultionResult) => void,
        errorCallBack: () => void,
        additionalParams?: ResolutionParams
    ) => void;
    resolutionCallUrl?: (additionalParams: ResolutionParams) => string;
    peopleVerifiedId?: string;
    config: LiveConnectConfig;
    eventBus?: EventBus;
}
