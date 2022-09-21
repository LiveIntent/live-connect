interface identityResolutionConfig{
    url?: string,
    expirationHours?: number,
    ajaxTimeout?:number,
    source: string,
    publisherId: number
    requestedAttributes: string[],
    contextSelectors: string,
    contextElementsLength: number
}


export interface liveConnectConfig extends identityResolutionConfig{
    appId?: string,
    wrapperName?: string,
    storageStrategy?: 'cookie' | 'ls' | 'none' | 'disabled',
    /** @defaultValue `https://rp.liadm.com` **/
    collectorUrl?: string,
    usPrivacyString?: string,
    gdprApplies?: boolean,
    /** @defaultValue 730 **/
    expirationDays?: number,
    identifiersToResolve?: string[],
    trackerName?: string,
    identityResolutionConfig:identityResolutionConfig,
}
