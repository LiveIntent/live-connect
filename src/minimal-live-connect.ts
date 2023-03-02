// @ts-nocheck
/* eslint-disable */
import { mergeObjects } from './pixel/fiddler'
import { IdentityResolver } from './idex'
import { enrich as peopleVerified } from './enrichers/people-verified'
import { enrich as additionalIdentifiers } from './enrichers/identifiers-nohash'
import { enrich as privacyConfig } from './enrichers/privacy-config'
import { removeInvalidPairs } from './config-validators/remove-invalid-pairs'
import { WrappedReadOnlyStorageHandler } from './handlers/storage-handler'
import { WrappedCallHandler } from './handlers/call-handler'
import { StorageStrategies } from './model/storage-strategy'
import { EventBus, ILiveConnect, LiveConnectConfig } from './types'
import { LocalEventBus } from './events/event-bus'
import { ReadOnlyStorageHandler, CallHandler, isObject } from 'live-connect-common'

function _minimalInitialization(liveConnectConfig: LiveConnectConfig, externalStorageHandler: ReadOnlyStorageHandler, externalCallHandler: CallHandler, eventBus: EventBus, push: (event: unknown) => void): ILiveConnect {
  try {
    const callHandler = new WrappedCallHandler(externalCallHandler, eventBus)
    const validLiveConnectConfig = removeInvalidPairs(liveConnectConfig, eventBus)
    const configWithPrivacy = mergeObjects(validLiveConnectConfig, privacyConfig(validLiveConnectConfig))
    const storageStrategy = configWithPrivacy.privacyMode ? StorageStrategies.disabled : configWithPrivacy.storageStrategy
    const storageHandler = WrappedReadOnlyStorageHandler.make(storageStrategy, externalStorageHandler, eventBus)
    const peopleVerifiedData = mergeObjects(configWithPrivacy, peopleVerified(configWithPrivacy, storageHandler, eventBus))
    const peopleVerifiedDataWithAdditionalIds = mergeObjects(peopleVerifiedData, additionalIdentifiers(peopleVerifiedData, storageHandler, eventBus))
    const resolver = IdentityResolver.makeNoCache(peopleVerifiedDataWithAdditionalIds, callHandler, eventBus)
    return {
      push: (arg) => push(arg),
      fire: () => push({}),
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

function _initializeWithoutGlobalName(liveConnectConfig: LiveConnectConfig, externalStorageHandler: ReadOnlyStorageHandler, externalCallHandler: CallHandler, eventBus: EventBus) {
  return _minimalInitialization(liveConnectConfig, externalStorageHandler, externalCallHandler, eventBus, (event: unknown) => {})
}

function _initializeWithGlobalName(liveConnectConfig: LiveConnectConfig, externalStorageHandler: ReadOnlyStorageHandler, externalCallHandler: CallHandler, eventBus: EventBus) {
  const queue = window[liveConnectConfig.globalVarName] = window[liveConnectConfig.globalVarName] || []
  const push = queue.push.bind(queue)
  return _minimalInitialization(liveConnectConfig, externalStorageHandler, externalCallHandler, eventBus, push)
}

export function MinimalLiveConnect(liveConnectConfig: LiveConnectConfig, externalStorageHandler: ReadOnlyStorageHandler, externalCallHandler: CallHandler, externalEventBus?: EventBus): ILiveConnect {
  try {
    const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {}
    const eventBus = externalEventBus || LocalEventBus()

    const lc = configuration.globalVarName ?
      _initializeWithGlobalName(configuration, externalStorageHandler, externalCallHandler, eventBus) :
      _initializeWithoutGlobalName(configuration, externalStorageHandler, externalCallHandler, eventBus)
    
    window.liQ_instances = window.liQ_instances || []
    if (configuration.globalVarName) {
      if (window.liQ_instances.filter(i => i.config.globalVarName === configuration.globalVarName).length === 0) {
        window.liQ_instances.push(lc)
      }
    } else {
      window.liQ_instances.push(lc)
    }

    return lc
  } catch (x) {
    console.error(x)
  }
  return {}
}
