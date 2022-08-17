/**
 * @typedef {Object} StandardLiveConnect
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
import * as errorHandler from './events/error-pixel'
import * as C from './utils/consts'
import { StateWrapper } from './pixel/state'
import { resolve as idResolve } from './manager/identifiers'
import { resolve as decisionsResolve } from './manager/decisions'
import { enrich as pageEnrich } from './enrichers/page'
import { enrich as identifiersEnrich } from './enrichers/identifiers'
import { enrich as privacyConfig } from './enrichers/privacy-config'
import { isArray, isObject, merge } from './utils/types'
import { IdentityResolver } from './idex/identity-resolver'
import { StorageHandler } from './handlers/storage-handler'
import { CallHandler } from './handlers/call-handler'
import { StorageStrategy } from './model/storage-strategy'
import { LocalEventBus, wrap } from './events/event-bus'

const hemStore = {}
function _pushSingleEvent (eventBus, event, pixelClient, enrichedState) {
  if (!event || !isObject(event)) {
    eventBus.emitError('EventNotAnObject', 'Received event was not an object', new Error(event))
  } else if (event.config) {
    eventBus.emitError('StrayConfig', 'Received a config after LC has already been initialised', new Error(event))
  } else {
    const combined = enrichedState.combineWith({ eventSource: event })
    hemStore.hashedEmail = hemStore.hashedEmail || combined.data.hashedEmail
    const withHemStore = merge({ eventSource: event }, hemStore)
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

function _processArgs (eventBus, args, pixelClient, enrichedState) {
  try {
    args.forEach(arg => {
      const event = arg
      if (isArray(event)) {
        event.forEach(e => _pushSingleEvent(eventBus, e, pixelClient, enrichedState))
      } else {
        _pushSingleEvent(eventBus, event, pixelClient, enrichedState)
      }
    })
  } catch (e) {
    console.error('Error sending events', e)
    eventBus.emitError('LCPush', 'Failed sending an event', e)
  }
}

/**
 *
 * @param {LiveConnectConfiguration} liveConnectConfig
 * @return {StandardLiveConnect|null}
 * @private
 */
function _getInitializedLiveConnect (liveConnectConfig) {
  try {
    if (window && window[liveConnectConfig.globalVarName] && window[liveConnectConfig.globalVarName].ready) {
      const mismatchedConfig = window[liveConnectConfig.globalVarName].config && _configMatcher(window[liveConnectConfig.globalVarName].config, liveConnectConfig)
      if (mismatchedConfig) {
        const error = new Error()
        error.name = 'ConfigSent'
        error.message = 'Additional configuration received'

        const eventBus = window[liveConnectConfig.globalVarName].eventBus || (window[C.EVENT_BUS_NAMESPACE] && wrap(window[C.EVENT_BUS_NAMESPACE]))
        window[liveConnectConfig.globalVarName].eventBus = eventBus
        eventBus.emitError('LCDuplication', JSON.stringify(mismatchedConfig), error)
      }
      return window[liveConnectConfig.globalVarName]
    }
  } catch (e) {
    console.error('Could not initialize error bus')
  }
}

/**
 * @param {LiveConnectConfiguration} liveConnectConfig
 * @param {StorageHandler} externalStorageHandler
 * @param {CallHandler} externalCallHandler
 * @returns {StandardLiveConnect}
 * @private
 */
function _standardInitialization (liveConnectConfig, externalStorageHandler, externalCallHandler, eventBus) {
  try {
    const callHandler = CallHandler(eventBus, externalCallHandler)
    const configWithPrivacy = merge(liveConnectConfig, privacyConfig(liveConnectConfig))
    errorHandler.register(eventBus, configWithPrivacy, callHandler)
    const storageStrategy = configWithPrivacy.privacyMode ? StorageStrategy.disabled : configWithPrivacy.storageStrategy
    const storageHandler = StorageHandler(eventBus, storageStrategy, externalStorageHandler)
    const reducer = (accumulator, func) => accumulator.combineWith(func(accumulator.data, storageHandler, eventBus))

    const enrichers = [pageEnrich, identifiersEnrich]
    const managers = [idResolve, decisionsResolve]

    const enrichedState = enrichers.reduce(reducer, new StateWrapper(eventBus, configWithPrivacy))
    const postManagedState = managers.reduce(reducer, enrichedState)

    console.log('LiveConnect.enrichedState', enrichedState)
    console.log('LiveConnect.postManagedState', postManagedState)
    const syncContainerData = merge(configWithPrivacy, { peopleVerifiedId: postManagedState.data.peopleVerifiedId })
    const onPixelLoad = () => eventBus.emit(C.PIXEL_SENT_PREFIX, syncContainerData)
    const onPixelPreload = () => eventBus.emit(C.PRELOAD_PIXEL, '0')
    const pixelClient = new PixelSender(eventBus, configWithPrivacy, callHandler, onPixelLoad, onPixelPreload)
    const resolver = IdentityResolver(eventBus, postManagedState.data, storageHandler, callHandler)
    const _push = (...args) => _processArgs(eventBus, args, pixelClient, postManagedState)
    const lc = {
      push: _push,
      fire: () => _push({}),
      peopleVerifiedId: postManagedState.data.peopleVerifiedId,
      ready: true,
      resolve: resolver.resolve,
      resolutionCallUrl: resolver.getUrl,
      config: liveConnectConfig,
      eventBus: eventBus
    }
    return lc
  } catch (x) {
    console.error(x)
    eventBus.emitError('LCConstruction', 'Failed to build LC', x)
  }
}

/**
 * @param {LiveConnectConfiguration} liveConnectConfig
 * @param {StorageHandler} externalStorageHandler
 * @param {CallHandler} externalCallHandler
 * @returns {StandardLiveConnect}
 * @constructor
 */
export function StandardLiveConnect (liveConnectConfig, externalStorageHandler, externalCallHandler, externalEventBus) {
  console.log('Initializing LiveConnect')
  const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {}
  configuration.globalVarName = configuration.globalVarName || 'liQ'
  const eventBus = externalEventBus || LocalEventBus()
  try {
    const queue = window[configuration.globalVarName] || []
    window && (window[configuration.globalVarName] = _getInitializedLiveConnect(configuration) || _standardInitialization(configuration, externalStorageHandler, externalCallHandler, eventBus) || queue)
    if (isArray(queue)) {
      for (let i = 0; i < queue.length; i++) {
        window[configuration.globalVarName].push(queue[i])
      }
    }
  } catch (x) {
    console.error(x)
    eventBus.emitError('LCConstruction', 'Failed to build LC', x)
  }
  return window[configuration.globalVarName]
}
