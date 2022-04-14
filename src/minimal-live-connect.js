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
import { enrich as noCookiesConfig } from './enrichers/privacy-config'
import { StorageHandler } from './handlers/read-storage-handler'
import { CallHandler } from './handlers/call-handler'
import { StorageStrategy } from './model/storage-strategy'

/**
 * @param {LiveConnectConfiguration} liveConnectConfig
 * @param {StorageHandler} externalStorageHandler
 * @param {CallHandler} externalCallHandler
 * @returns {MinimalLiveConnect}
 * @private
 */
function _minimalInitialization (liveConnectConfig, externalStorageHandler, externalCallHandler) {
  try {
    const callHandler = CallHandler(externalCallHandler)
    const storageStrategy = liveConnectConfig.gdprApplies ? StorageStrategy.disabled : liveConnectConfig.storageStrategy
    const storageHandler = StorageHandler(storageStrategy, externalStorageHandler)
    const peopleVerifiedData = merge(liveConnectConfig, peopleVerified(liveConnectConfig, storageHandler))
    const peopleVerifiedDataWithAdditionalIds = merge(peopleVerifiedData, additionalIdentifiers(peopleVerifiedData, storageHandler))
    const finalConfig = merge(peopleVerifiedDataWithAdditionalIds, noCookiesConfig(peopleVerifiedDataWithAdditionalIds))
    const resolver = IdentityResolver(finalConfig, callHandler)
    return {
      push: (arg) => window.liQ.push(arg),
      fire: () => window.liQ.push({}),
      peopleVerifiedId: peopleVerifiedData.peopleVerifiedId,
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
 * @returns {MinimalLiveConnect}
 * @constructor
 */
export function MinimalLiveConnect (liveConnectConfig, externalStorageHandler, externalCallHandler) {
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
