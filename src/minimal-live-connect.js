/**
 * @typedef {Object} MinimalLiveConnect
 * @property {(function)} push
 * @property {(function)} fire
 * @property {(function)} peopleVerifiedId
 * @property {(boolean)} ready
 * @property {(function)} resolve
 * @property {(function)} resolutionCallUrl
 * @property {(LiveConnectConfiguration)} config
 */

import { isObject, merge } from './utils/types'
import { IdentityResolver } from './idex/identity-resolver-nocache'
import { enrich as peopleVerified } from './enrichers/people-verified'
import { enrich as additionalIdentifiers } from './enrichers/identifiers-nohash'
import { enrich as privacyConfig } from './enrichers/privacy-config'
import { StorageHandler } from './handlers/read-storage-handler'
import { CallHandler } from './handlers/call-handler'
import { StorageStrategy } from './model/storage-strategy'
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
  try {
    const callHandler = CallHandler(externalCallHandler, eventBus)
    const configWithPrivacy = merge(liveConnectConfig, privacyConfig(liveConnectConfig))
    const storageStrategy = configWithPrivacy.privacyMode ? StorageStrategy.disabled : configWithPrivacy.storageStrategy
    const storageHandler = StorageHandler(storageStrategy, externalStorageHandler, eventBus)
    const peopleVerifiedData = merge(configWithPrivacy, peopleVerified(configWithPrivacy, storageHandler))
    const peopleVerifiedDataWithAdditionalIds = merge(peopleVerifiedData, additionalIdentifiers(peopleVerifiedData, storageHandler))
    const resolver = IdentityResolver(peopleVerifiedDataWithAdditionalIds, callHandler, eventBus)
    return {
      push: (arg) => window[liveConnectConfig.globalVarName].push(arg),
      fire: () => window[liveConnectConfig.globalVarName].push({}),
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

/**
 * @param {LiveConnectConfiguration} liveConnectConfig
 * @param {StorageHandler} externalStorageHandler
 * @param {CallHandler} externalCallHandler
 * @param {EventBus} externalEventBus
 * @returns {MinimalLiveConnect}
 * @constructor
 */
export function MinimalLiveConnect (liveConnectConfig, externalStorageHandler, externalCallHandler, externalEventBus) {
  console.log('Initializing LiveConnect')
  try {
    const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {}
    configuration.globalVarName = configuration.globalVarName || 'liQ'
    window && (window[configuration.globalVarName] = window[configuration.globalVarName] || [])
    const eventBus = externalEventBus || LocalEventBus()
    const lc = _minimalInitialization(configuration, externalStorageHandler, externalCallHandler, eventBus)
    window.liQ_instances = window.liQ_instances || []
    if (window.liQ_instances.filter(i => i.config.globalVarName === configuration.globalVarName).length === 0) {
      window.liQ_instances.push(window[configuration.globalVarName])
    }
    return lc
  } catch (x) {
    console.error(x)
  }
  return {}
}
