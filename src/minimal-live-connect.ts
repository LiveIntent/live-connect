import { isObject, merge } from './utils/types'
import { IdentityResolver } from './idex/identity-resolver-nocache'
import { enrich as peopleVerified } from './enrichers/people-verified'
import { enrich as additionalIdentifiers } from './enrichers/identifiers-nohash'
import { enrich as privacyConfig } from './enrichers/privacy-config'
import { removeInvalidPairs } from './config-validators/remove-invalid-pairs'
import { StorageHandler } from './handlers/read-storage-handler'
import { CallHandler } from './handlers/call-handler'
import { StorageStrategy } from './model/storage-strategy'
<<<<<<< HEAD:src/minimal-live-connect.ts
import { ExternalCallHandler, ExternalMinimalStorageHandler, ILiveConnect, LiveConnectConfig } from './types'

function _minimalInitialization (liveConnectConfig: LiveConnectConfig, externalStorageHandler: ExternalMinimalStorageHandler, externalCallHandler: ExternalCallHandler): ILiveConnect {
=======
import { LocalEventBus } from './events/event-bus'

/**
 * @param {LiveConnectConfiguration} liveConnectConfig
 * @param {StorageHandler} externalStorageHandler
 * @param {CallHandler} externalCallHandler
 * @param {EventBus} eventBus
 * @returns {MinimalLiveConnect}
 * @private
 */
function _minimalInitialization (liveConnectConfig, externalStorageHandler, externalCallHandler, eventBus) {
>>>>>>> master:src/minimal-live-connect.js
  try {
    const callHandler = CallHandler(externalCallHandler, eventBus)
    const validLiveConnectConfig = removeInvalidPairs(liveConnectConfig, eventBus)
    const configWithPrivacy = merge(validLiveConnectConfig, privacyConfig(validLiveConnectConfig))
    const storageStrategy = configWithPrivacy.privacyMode ? StorageStrategy.disabled : configWithPrivacy.storageStrategy
    const storageHandler = StorageHandler(storageStrategy, externalStorageHandler, eventBus)
    const peopleVerifiedData = merge(configWithPrivacy, peopleVerified(configWithPrivacy, storageHandler))
    const peopleVerifiedDataWithAdditionalIds = merge(peopleVerifiedData, additionalIdentifiers(peopleVerifiedData, storageHandler))
    const resolver = IdentityResolver(peopleVerifiedDataWithAdditionalIds, callHandler, eventBus)
    return {
      push: (arg) => window[validLiveConnectConfig.globalVarName].push(arg),
      fire: () => window[validLiveConnectConfig.globalVarName].push({}),
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

<<<<<<< HEAD:src/minimal-live-connect.ts
export function MinimalLiveConnect (liveConnectConfig: LiveConnectConfig, externalStorageHandler: ExternalMinimalStorageHandler, externalCallHandler: ExternalCallHandler): ILiveConnect {
=======
/**
 * @param {LiveConnectConfiguration} liveConnectConfig
 * @param {StorageHandler} externalStorageHandler
 * @param {CallHandler} externalCallHandler
 * @param {EventBus} externalEventBus
 * @returns {MinimalLiveConnect}
 * @constructor
 */
export function MinimalLiveConnect (liveConnectConfig, externalStorageHandler, externalCallHandler, externalEventBus) {
>>>>>>> master:src/minimal-live-connect.js
  console.log('Initializing LiveConnect')
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
