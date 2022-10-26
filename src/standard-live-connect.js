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
import { GlobalEventBus, getAndAttachGlobalBus } from './events/event-bus'
import { EVENT_BUS_NAMESPACE } from './utils/consts'

const hemStore = {}
function _pushSingleEvent (event, pixelClient, enrichedState, eventBus) {
  if (!event || !isObject(event)) {
    eventBus.emitErrorWithMessage('EventNotAnObject', 'Received event was not an object', new Error(event))
  } else if (event.config) {
    eventBus.emitErrorWithMessage('StrayConfig', 'Received a config after LC has already been initialised', new Error(event))
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

function _processArgs (args, pixelClient, enrichedState, eventBus) {
  try {
    args.forEach(arg => {
      const event = arg
      if (isArray(event)) {
        event.forEach(e => _pushSingleEvent(e, pixelClient, enrichedState, eventBus))
      } else {
        _pushSingleEvent(event, pixelClient, enrichedState, eventBus)
      }
    })
  } catch (e) {
    console.error('Error sending events', e)
    eventBus.emitErrorWithMessage('LCPush', 'Failed sending an event', e)
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
        const eventBus = getAndAttachGlobalBus(liveConnectConfig.globalVarName)
        eventBus.emitErrorWithMessage('LCDuplication', JSON.stringify(mismatchedConfig), error)
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
 * @param {EventBus} eventBus
 * @returns {StandardLiveConnect}
 * @private
 */
function _standardInitialization (liveConnectConfig, externalStorageHandler, externalCallHandler, eventBus) {
  try {
    const callHandler = CallHandler(externalCallHandler, eventBus)
    const configWithPrivacy = merge(liveConnectConfig, privacyConfig(liveConnectConfig))
    errorHandler.register(configWithPrivacy, callHandler, eventBus)
    const storageStrategy = configWithPrivacy.privacyMode ? StorageStrategy.disabled : configWithPrivacy.storageStrategy
    const storageHandler = StorageHandler(storageStrategy, externalStorageHandler, eventBus)
    const reducer = (accumulator, func) => accumulator.combineWith(func(accumulator.data, storageHandler, eventBus))

    const enrichers = [pageEnrich, identifiersEnrich]
    const managers = [idResolve, decisionsResolve]

    const enrichedState = enrichers.reduce(reducer, new StateWrapper(configWithPrivacy, eventBus))
    const postManagedState = managers.reduce(reducer, enrichedState)

    console.log('LiveConnect.enrichedState', enrichedState)
    console.log('LiveConnect.postManagedState', postManagedState)
    const syncContainerData = merge(configWithPrivacy, { peopleVerifiedId: postManagedState.data.peopleVerifiedId })
    const onPixelLoad = () => eventBus.emit(C.PIXEL_SENT_PREFIX, syncContainerData)
    const onPixelPreload = () => eventBus.emit(C.PRELOAD_PIXEL, '0')
    const pixelClient = new PixelSender(configWithPrivacy, callHandler, eventBus, onPixelLoad, onPixelPreload)
    const resolver = IdentityResolver(postManagedState.data, storageHandler, callHandler, eventBus)
    const _push = (...args) => _processArgs(args, pixelClient, postManagedState, eventBus)
    return {
      push: _push,
      fire: () => _push({}),
      peopleVerifiedId: postManagedState.data.peopleVerifiedId,
      ready: true,
      resolve: resolver.resolve,
      resolutionCallUrl: resolver.getUrl,
      config: liveConnectConfig,
      eventBus: eventBus
    }
  } catch (x) {
    console.error(x)
    eventBus.emitErrorWithMessage('LCConstruction', 'Failed to build LC', x)
  }
}

/**
 * @param {LiveConnectConfiguration} liveConnectConfig
 * @param {StorageHandler} externalStorageHandler
 * @param {CallHandler} externalCallHandler
 * @param {EventBus} externalEventBus
 * @returns {StandardLiveConnect}
 * @constructor
 */
export function StandardLiveConnect (liveConnectConfig, externalStorageHandler, externalCallHandler, externalEventBus) {
  console.log('Initializing LiveConnect')
  const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {}
  configuration.globalVarName = configuration.globalVarName || 'liQ'
  const eventBus = externalEventBus || GlobalEventBus(EVENT_BUS_NAMESPACE)
  try {
    const queue = window[configuration.globalVarName] || []
    window && (window[configuration.globalVarName] = _getInitializedLiveConnect(configuration) || _standardInitialization(configuration, externalStorageHandler, externalCallHandler, eventBus) || queue)
    if (isArray(queue)) {
      for (let i = 0; i < queue.length; i++) {
        window[configuration.globalVarName].push(queue[i])
      }
    }
    window.liQ_instances = window.liQ_instances || []

    if (window.liQ_instances.filter(i => i.config.globalVarName === configuration.globalVarName).length === 0) {
      window.liQ_instances.push(window[configuration.globalVarName])
    }
  } catch (x) {
    console.error(x)
    eventBus.emitErrorWithMessage('LCConstruction', 'Failed to build LC', x)
  }
  return window[configuration.globalVarName]
}
