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

/**
 * @typedef {Object} IdexConfig
 * @property {(number|undefined)} expirationHours
 * @property {(number|undefined)} ajaxTimeout
 * @property {(string|undefined)} source
 * @property {(number|undefined)} publisherId
 * @property {(string|undefined)} url
 */

/**
 * @typedef {Object} LiveConnectConfiguration
 * @property {(string|undefined)} appId
 * @property {(StorageStrategy|null)} storageStrategy
 * @property {(string|undefined)} collectorUrl
 * @property {(string|undefined)} usPrivacyString
 * @property {(number|undefined)} expirationDays
 * @property {{string[]|undefined}} identifiersToResolve
 * @property {string|undefined} wrapperName
 * @property {{IdexConfig|undefined}} identityResolutionConfig
 */

import * as peopleVerified from './enrichers/people-verified'
import { isObject } from './utils/types'
import { IdentityResolver } from './idex/identity-resolver-nocache'
import { enrich } from './enrichers/identifiers-nohash'
import { StorageHandler } from './handlers/read-storage-handler'
import { CallHandler } from './handlers/call-handler'

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
    const storageHandler = StorageHandler(liveConnectConfig.storageStrategy, externalStorageHandler)
    const peopleVerifiedData = peopleVerified.enrich(liveConnectConfig, storageHandler)
    const finalData = { ...peopleVerifiedData, ...enrich(liveConnectConfig, storageHandler) }
    const resolver = IdentityResolver(finalData, storageHandler, callHandler)
    return {
      push: window.liQ.push,
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
    window.liQ = window.liQ || []
    const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {}
    return _minimalInitialization(configuration, externalStorageHandler, externalCallHandler)
  } catch (x) {
    console.error(x)
  }
  return {}
}
