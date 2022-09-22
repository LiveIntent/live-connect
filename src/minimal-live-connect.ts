import { State } from './pixel/state'

import { IdentityResolver, noCacheIdentityResolver } from './idex/identity-resolver'

import { isObject, merge } from './utils/types'
import { enrich as peopleVerified } from './enrichers/people-verified'
import { enrich as additionalIdentifiers } from './enrichers/identifiers-nohash'
import { enrich as privacyConfig } from './enrichers/privacy-config'
import { minimalFromExternalStorageHandler } from './handlers/read-storage-handler'
import { ExternalCallHandler, fromExternalCallHandler } from './handlers/call-handler'
import { StorageStrategy } from './model/storage-strategy'
import { IdentityResultionResult, LiveConnectConfig, ResolutionParams } from './types'
import type { LiveConnect } from './types'
import { ExternalStorageHandler } from './handlers/types'

export class MinimalLiveConnect implements LiveConnect {
  config: LiveConnectConfig
  ready = false
  resolver: IdentityResolver
  peopleVerifiedId: string

  constructor (liveConnectConfig: State, externalStorageHandler: ExternalStorageHandler, externalCallHandler: ExternalCallHandler) {
    console.log('Initializing LiveConnect')
    try {
      window && (window.liQ = window.liQ || [])
      const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {}
      const callHandler = fromExternalCallHandler(externalCallHandler)
      const configWithPrivacy = merge(configuration, privacyConfig(configuration))
      const storageStrategy = configWithPrivacy.privacyMode ? StorageStrategy.disabled : configWithPrivacy.storageStrategy
      const storageHandler = minimalFromExternalStorageHandler(storageStrategy, externalStorageHandler)
      const peopleVerifiedData = merge(configWithPrivacy, peopleVerified(configWithPrivacy, storageHandler))
      const peopleVerifiedDataWithAdditionalIds = merge(peopleVerifiedData, additionalIdentifiers(peopleVerifiedData, storageHandler))

      this.resolver = noCacheIdentityResolver(peopleVerifiedDataWithAdditionalIds, callHandler)
      this.config = configuration
      this.peopleVerifiedId = peopleVerifiedDataWithAdditionalIds.peopleVerifiedId
      this.ready = true
    } catch (x) {
      console.error(x)
    }
  }

  resolve (
    successCallBack: (result: IdentityResultionResult) => void,
    errorCallBack: () => void,
    additionalParams?: ResolutionParams
  ): void {
    return this.resolver.resolve(successCallBack, errorCallBack, additionalParams)
  }

  resolutionCallUrl (additionalParams: ResolutionParams): string {
    return this.resolver.getUrl(additionalParams)
  }

  push (event: object): void {
    window.liQ.push(event)
  }

  fire (): void {
    this.push({})
  }
}
