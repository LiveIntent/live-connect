import { isFunction, isObject, merge } from './utils/types'
import { IdentityResolver } from './idex/identity-resolver-nocache'
import { enrich as peopleVerified } from './enrichers/people-verified'
import { enrich as additionalIdentifiers } from './enrichers/identifiers-nohash'
import { enrich as privacyConfig } from './enrichers/privacy-config'
import { removeInvalidPairs } from './config-validators/remove-invalid-pairs'
import { MinimalStorageHandler, StorageHandler } from './handlers/storage-handler'
import { CallHandler } from './handlers/call-handler'
import { StorageStrategy } from './model/storage-strategy'
import { EventBus, ExternalCallHandler, ExternalMinimalStorageHandler, ILiveConnect, LiveConnectConfig } from './types'
import { LocalEventBus } from './events/event-bus'

function _minimalInitialization (globalVarName: string, liveConnectConfig: LiveConnectConfig, externalStorageHandler: ExternalMinimalStorageHandler, externalCallHandler: ExternalCallHandler, eventBus: EventBus): ILiveConnect | null {
  try {
    const callHandler = new CallHandler(externalCallHandler, eventBus)
    const validLiveConnectConfig = removeInvalidPairs(liveConnectConfig, eventBus)
    const configWithPrivacy = merge(validLiveConnectConfig, privacyConfig(validLiveConnectConfig))
    const storageStrategy = configWithPrivacy.privacyMode ? StorageStrategy.disabled : configWithPrivacy.storageStrategy || StorageStrategy.cookie
    const storageHandler = new MinimalStorageHandler(storageStrategy, externalStorageHandler, eventBus)
    const peopleVerifiedData = merge(configWithPrivacy, peopleVerified(configWithPrivacy, storageHandler, eventBus))
    const peopleVerifiedDataWithAdditionalIds = merge(peopleVerifiedData, additionalIdentifiers(peopleVerifiedData, storageHandler, eventBus))
    const resolver = IdentityResolver(peopleVerifiedDataWithAdditionalIds, callHandler, eventBus)
    const _push = (arg: any) => {
      try {
        if (window && globalVarName in window) {
          const lcCandidate = window[globalVarName]
          if (isObject(lcCandidate) && 'push' in lcCandidate) {
            const maybeFun = lcCandidate.push
            if (isFunction(maybeFun)) {
              maybeFun(arg)
            }
          }
        }
      } catch {
        // pass
      }
    }
    return {
      push: _push,
      fire: () => _push({}),
      peopleVerifiedId: peopleVerifiedDataWithAdditionalIds.peopleVerifiedId,
      ready: true,
      resolve: resolver.resolve,
      resolutionCallUrl: resolver.getUrl,
      config: validLiveConnectConfig,
      eventBus: eventBus
    }
  } catch (x) {
    console.error(x)
    return null
  }
}

export function MinimalLiveConnect (liveConnectConfig: LiveConnectConfig, externalStorageHandler: ExternalMinimalStorageHandler, externalCallHandler: ExternalCallHandler, externalEventBus?: EventBus): ILiveConnect | null {
  try {
    const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {}
    const globalVarName = configuration.globalVarName || (configuration.globalVarName = 'liQ')

    if (window) {
      window[configuration.globalVarName] = window[configuration.globalVarName] || []
    }

    const eventBus = externalEventBus || LocalEventBus()
    const lc = _minimalInitialization(globalVarName, configuration, externalStorageHandler, externalCallHandler, eventBus)

    if (window && lc) {
      window.liQ_instances = window.liQ_instances || []
      if (window.liQ_instances.filter(i => i.config.globalVarName === configuration.globalVarName).length === 0) {
        window.liQ_instances.push(lc)
      }
    }
    return lc
  } catch (x) {
    console.error(x)
  }
  return null
}
