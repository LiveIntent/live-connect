import { isObject, merge } from './utils/types'
import { IdentityResolver } from './idex/identity-resolver-nocache'
import { enrich as peopleVerified } from './enrichers/people-verified'
import { enrich as additionalIdentifiers } from './enrichers/identifiers-nohash'
import { enrich as privacyConfig } from './enrichers/privacy-config'
import { removeInvalidPairs } from './config-validators/remove-invalid-pairs'
import { StorageHandler } from './handlers/read-storage-handler'
import { CallHandler } from './handlers/call-handler'
import { StorageStrategy } from './model/storage-strategy'
import { EventBus, ExternalCallHandler, ExternalMinimalStorageHandler, ILiveConnect, LiveConnectConfig } from './types'
import { LocalEventBus } from './events/event-bus'

function _minimalInitialization (liveConnectConfig: LiveConnectConfig, externalStorageHandler: ExternalMinimalStorageHandler, externalCallHandler: ExternalCallHandler, eventBus: EventBus): ILiveConnect {
  try {
    const callHandler = CallHandler(externalCallHandler, eventBus)
    const validLiveConnectConfig = removeInvalidPairs(liveConnectConfig, eventBus)
    const configWithPrivacy = merge(validLiveConnectConfig, privacyConfig(validLiveConnectConfig))
    const storageStrategy = configWithPrivacy.privacyMode ? StorageStrategy.disabled : configWithPrivacy.storageStrategy
    const storageHandler = StorageHandler(storageStrategy, externalStorageHandler, eventBus)
    const peopleVerifiedData = merge(configWithPrivacy, peopleVerified(configWithPrivacy, storageHandler, eventBus))
    const peopleVerifiedDataWithAdditionalIds = merge(peopleVerifiedData, additionalIdentifiers(peopleVerifiedData, storageHandler, eventBus))
    const resolver = IdentityResolver(peopleVerifiedDataWithAdditionalIds, callHandler, eventBus)
    return {
      push: (arg) => (window[validLiveConnectConfig.globalVarName] as ILiveConnect).push(arg),
      fire: () => (window[validLiveConnectConfig.globalVarName] as ILiveConnect).push({}),
      peopleVerifiedId: peopleVerifiedDataWithAdditionalIds.peopleVerifiedId,
      ready: true,
      resolve: resolver.resolve,
      resolutionCallUrl: resolver.getUrl,
      config: validLiveConnectConfig,
      eventBus: eventBus
    }
  } catch (x) {
    console.error(x)
  }
}

export function MinimalLiveConnect (liveConnectConfig: LiveConnectConfig, externalStorageHandler: ExternalMinimalStorageHandler, externalCallHandler: ExternalCallHandler, externalEventBus?: EventBus): ILiveConnect {
  try {
    const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {}
    configuration.globalVarName = configuration.globalVarName || 'liQ'
    if (window) {
      window[configuration.globalVarName] = window[configuration.globalVarName] || []
    }
    const eventBus = externalEventBus || LocalEventBus()
    const lc = _minimalInitialization(configuration, externalStorageHandler, externalCallHandler, eventBus)
    window.liQ_instances = window.liQ_instances || []
    if (window.liQ_instances.filter(i => i.config.globalVarName === configuration.globalVarName).length === 0) {
      window.liQ_instances.push(lc)
    }
    return lc
  } catch (x) {
    console.error(x)
  }
  return {}
}
