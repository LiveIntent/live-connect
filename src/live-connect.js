/**
 * @typedef {Object} LiveConnect
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

import { PixelSender } from './pixel/sender'
import { StateWrapper } from './pixel/state'
import * as identifiers from './manager/identifiers'
import * as decisions from './manager/decisions'
import * as peopleVerified from './manager/people-verified'
import * as eventBus from './events/bus'
import * as pageEnricher from './enrichers/page'
import * as emitter from './utils/emitter'
import * as errorHandler from './events/error-pixel'
import * as C from './utils/consts'
import * as cookies from './enrichers/identifiers'
import * as legacyDuid from './enrichers/legacy-duid'
import { isArray, isObject } from './utils/types'
import * as idex from './idex/identity-resolver'
import { StorageHandler } from './handlers/storage-handler'
import { CallHandler } from './handlers/call-handler'

const hemStore = {}
const _minimalMode = process.env.LiveConnectMode === 'minimal'

function _pushSingleEvent (event, pixelClient, enrichedState) {
  if (!event || !isObject(event)) {
    emitter.error('EventNotAnObject', 'Received event was not an object', new Error(event))
  } else if (event.config) {
    emitter.error('StrayConfig', 'Received a config after LC has already been initialised', new Error(event))
  } else {
    const combined = enrichedState.combineWith({ eventSource: event })
    hemStore.hashedEmail = hemStore.hashedEmail || combined.data.hashedEmail
    const withHemStore = { eventSource: event, ...hemStore }
    pixelClient.sendAjax(enrichedState.combineWith(withHemStore))
  }
}

/**
 *
 * @param {LiveConnectConfiguration} previousConfig
 * @param {LiveConnectConfiguration} newConfig
 * @return {Object|null}
 * @private
 */
function _configMatcher (previousConfig, newConfig) {
  const equalConfigs = previousConfig.appId === newConfig.appId &&
    previousConfig.wrapperName === newConfig.wrapperName &&
    previousConfig.collectorUrl === newConfig.collectorUrl
  if (!equalConfigs) {
    return {
      appId: [previousConfig.appId, newConfig.appId],
      wrapperName: [previousConfig.wrapperName, newConfig.wrapperName],
      collectorUrl: [previousConfig.collectorUrl, newConfig.collectorUrl]
    }
  }
}

function _processArgs (args, pixelClient, enrichedState) {
  try {
    args.forEach(arg => {
      if (isArray(arg)) {
        arg.forEach(e => _pushSingleEvent(e, pixelClient, enrichedState))
      } else {
        _pushSingleEvent(arg, pixelClient, enrichedState)
      }
    })
  } catch (e) {
    console.error('Error sending events', e)
    emitter.error('LCPush', 'Failed sending an event', e)
  }
}

/**
 *
 * @param {LiveConnectConfiguration} liveConnectConfig
 * @return {LiveConnect|null}
 * @private
 */
function _getInitializedLiveConnect (liveConnectConfig) {
  try {
    if (window && window.liQ && window.liQ.ready) {
      const mismatchedConfig = window.liQ.config && _configMatcher(window.liQ.config, liveConnectConfig)
      if (mismatchedConfig) {
        const error = new Error('Additional configuration received')
        error.name = 'ConfigSent'
        emitter.error('LCDuplication', JSON.stringify(mismatchedConfig), error)
      }
      return window.liQ
    }
  } catch (e) {
    console.error('Could not initialize error bus')
  }
}

/**
 * @param {LiveConnectConfiguration} liveConnectConfig
 * @param {StorageHandler} externalStorageHandler
 * @param {CallHandler} externalCallHandler
 * @returns {LiveConnect}
 * @private
 */
function _standardInitialization (liveConnectConfig, externalStorageHandler, externalCallHandler) {
  try {
    eventBus.init()
    const callHandler = CallHandler(externalCallHandler)
    errorHandler.register(liveConnectConfig, callHandler)

    const storageHandler = StorageHandler(liveConnectConfig.storageStrategy, externalStorageHandler)
    const reducer = (accumulator, func) => accumulator.combineWith(func(accumulator.data, storageHandler))

    const enrichers = [pageEnricher.enrich, cookies.enrich, legacyDuid.enrich]
    const managers = [identifiers.resolve, peopleVerified.resolve, decisions.resolve]

    const enrichedState = enrichers.reduce(reducer, new StateWrapper(liveConnectConfig))
    const postManagedState = managers.reduce(reducer, enrichedState)

    console.log('LiveConnect.enrichedState', enrichedState)
    console.log('LiveConnect.postManagedState', postManagedState)
    const syncContainerData = { ...liveConnectConfig, ...{ peopleVerifiedId: postManagedState.data.peopleVerifiedId } }
    const onPixelLoad = () => emitter.send(C.PIXEL_SENT_PREFIX, syncContainerData)
    const onPixelPreload = () => emitter.send(C.PRELOAD_PIXEL, '0')
    const pixelClient = new PixelSender(liveConnectConfig, callHandler, onPixelLoad, onPixelPreload)
    const resolver = idex.IdentityResolver(postManagedState.data, storageHandler, callHandler)
    const _push = (...args) => _processArgs(args, pixelClient, postManagedState)
    return {
      push: _push,
      fire: () => _push({}),
      peopleVerifiedId: postManagedState.data.peopleVerifiedId,
      ready: true,
      resolve: resolver.resolve,
      resolutionCallUrl: resolver.getUrl,
      config: liveConnectConfig
    }
  } catch (x) {
    console.error(x)
    emitter.error('LCConstruction', 'Failed to build LC', x)
  }
}

/**
 * @param {LiveConnectConfiguration} liveConnectConfig
 * @param {StorageHandler} externalStorageHandler
 * @param {CallHandler} externalCallHandler
 * @returns {LiveConnect}
 * @private
 */
function _minimalInitialization (liveConnectConfig, externalStorageHandler, externalCallHandler) {
  try {
    const callHandler = CallHandler(externalCallHandler)
    const storageHandler = StorageHandler(liveConnectConfig.storageStrategy, externalStorageHandler)
    const reducer = (accumulator, func) => accumulator.combineWith(func(accumulator.data, storageHandler))

    const managers = [identifiers.resolve, peopleVerified.resolve]
    const postManagedState = managers.reduce(reducer, new StateWrapper(liveConnectConfig))
    console.log('MinimalLiveConnect.postManagedState', postManagedState)
    const resolver = idex.IdentityResolver(postManagedState.data, storageHandler, callHandler)
    return {
      push: (value) => window.liQ.push(value),
      fire: () => window.liQ.push({}),
      peopleVerifiedId: postManagedState.data.peopleVerifiedId,
      resolve: resolver.resolve,
      resolutionCallUrl: resolver.getUrl,
      config: liveConnectConfig
    }
  } catch (x) {
    console.error(x)
    emitter.error('LCConstruction', 'Failed to build LC', x)
  }
}

function _nonMin (configuration, externalStorageHandler, externalCallHandler) {
  const queue = window.liQ || []
  window && (window.liQ = _getInitializedLiveConnect(configuration) || _standardInitialization(configuration, externalStorageHandler, externalCallHandler) || queue)
  if (isArray(queue)) {
    for (let i = 0; i < queue.length; i++) {
      window.liQ.push(queue[i])
    }
  }
  return window.liQ
}

function _min (configuration, externalStorageHandler, externalCallHandler) {
  window.liQ = window.liQ || []
  return _minimalInitialization(configuration, externalCallHandler, externalStorageHandler)
}
const _fun = _minimalMode ? _min : _nonMin

/**
 * @param {LiveConnectConfiguration} liveConnectConfig
 * @param {StorageHandler} externalStorageHandler
 * @param {CallHandler} externalCallHandler
 * @returns {LiveConnect}
 * @constructor
 */
export function LiveConnect (liveConnectConfig, externalStorageHandler, externalCallHandler) {
  console.log('Initializing LiveConnect')
  try {
    const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {}
    return _fun(configuration, externalStorageHandler, externalCallHandler)
  } catch (x) {
    console.error(x)
    emitter.error('LCConstruction', 'Failed to build LC', x)
  }
  return window.liQ
}
