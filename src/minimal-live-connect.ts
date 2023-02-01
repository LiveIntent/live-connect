// @ts-nocheck
import { isObject, merge } from './utils/types'
import { IdentityResolver } from './idex'
import { enrich as peopleVerified } from './enrichers/people-verified'
import { enrich as additionalIdentifiers } from './enrichers/identifiers-nohash'
import { enrich as privacyConfig } from './enrichers/privacy-config'
import { removeInvalidPairs } from './config-validators/remove-invalid-pairs'
import { MinimalStorageHandler } from './handlers/storage-handler'
import { CallHandler } from './handlers/call-handler'
import { StorageStrategies } from './model/storage-strategy'
import { EventBus, ExternalCallHandler, ExternalMinimalStorageHandler, ILiveConnect, LiveConnectConfig } from './types'
import { LocalEventBus } from './events/event-bus'

function _minimalInitialization(liveConnectConfig: LiveConnectConfig, externalStorageHandler: ExternalMinimalStorageHandler, externalCallHandler: ExternalCallHandler, eventBus: EventBus): ILiveConnect {
  try {
    const callHandler = new CallHandler(externalCallHandler, eventBus)
    const validLiveConnectConfig = removeInvalidPairs(liveConnectConfig, eventBus)
    const configWithPrivacy = merge(validLiveConnectConfig, privacyConfig(validLiveConnectConfig))
    const storageStrategy = configWithPrivacy.privacyMode ? StorageStrategies.disabled : configWithPrivacy.storageStrategy
    const storageHandler = MinimalStorageHandler.make(storageStrategy, externalStorageHandler, eventBus)
    const peopleVerifiedData = merge(configWithPrivacy, peopleVerified(configWithPrivacy, storageHandler, eventBus))
    const peopleVerifiedDataWithAdditionalIds = merge(peopleVerifiedData, additionalIdentifiers(peopleVerifiedData, storageHandler, eventBus))
    const resolver = IdentityResolver.makeNoCache(peopleVerifiedDataWithAdditionalIds, callHandler, eventBus)
    return {
      push: (arg) => (window[validLiveConnectConfig.globalVarName] as ILiveConnect).push(arg),
      fire: () => (window[validLiveConnectConfig.globalVarName] as ILiveConnect).push({}),
      peopleVerifiedId: peopleVerifiedDataWithAdditionalIds.peopleVerifiedId,
      ready: true,
      resolve: resolver.resolve.bind(resolver),
      resolutionCallUrl: resolver.getUrl.bind(resolver),
      config: validLiveConnectConfig,
      eventBus: eventBus
    }
  } catch (x) {
    console.error(x)
  }
}

export function MinimalLiveConnect(liveConnectConfig: LiveConnectConfig, externalStorageHandler: ExternalMinimalStorageHandler, externalCallHandler: ExternalCallHandler, externalEventBus?: EventBus): ILiveConnect {
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
