import { isObject, merge } from './utils/types'
import { IdentityResolver } from './idex/identity-resolver-nocache'
import { enrich as peopleVerified } from './enrichers/people-verified'
import { enrich as additionalIdentifiers } from './enrichers/identifiers-nohash'
import { enrich as privacyConfig } from './enrichers/privacy-config'
import { StorageHandler } from './handlers/read-storage-handler'
import { CallHandler } from './handlers/call-handler'
import { StorageStrategy } from './model/storage-strategy'
import { ExternalCallHandler, ExternalMinimalStorageHandler, ILiveConnect, LiveConnectConfig } from './types'

function _minimalInitialization (liveConnectConfig: LiveConnectConfig, externalStorageHandler: ExternalMinimalStorageHandler, externalCallHandler: ExternalCallHandler): ILiveConnect {
  try {
    const callHandler = CallHandler(externalCallHandler)
    const configWithPrivacy = merge(liveConnectConfig, privacyConfig(liveConnectConfig))
    const storageStrategy = configWithPrivacy.privacyMode ? StorageStrategy.disabled : configWithPrivacy.storageStrategy
    const storageHandler = StorageHandler(storageStrategy, externalStorageHandler)
    const peopleVerifiedData = merge(configWithPrivacy, peopleVerified(configWithPrivacy, storageHandler))
    const peopleVerifiedDataWithAdditionalIds = merge(peopleVerifiedData, additionalIdentifiers(peopleVerifiedData, storageHandler))
    const resolver = IdentityResolver(peopleVerifiedDataWithAdditionalIds, callHandler)
    return {
      push: (arg) => window.liQ.push(arg),
      fire: () => window.liQ.push({}),
      peopleVerifiedId: peopleVerifiedDataWithAdditionalIds.peopleVerifiedId,
      ready: true,
      resolve: resolver.resolve,
      resolutionCallUrl: resolver.getUrl,
      config: liveConnectConfig
    }
  } catch (x) {
    console.error(x)
  }
}

export function MinimalLiveConnect (liveConnectConfig: LiveConnectConfig, externalStorageHandler: ExternalMinimalStorageHandler, externalCallHandler: ExternalCallHandler): ILiveConnect {
  console.log('Initializing LiveConnect')
  try {
    window && (window.liQ = window.liQ || [])
    const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {}
    return _minimalInitialization(configuration, externalStorageHandler, externalCallHandler)
  } catch (x) {
    console.error(x)
  }
  return {}
}
