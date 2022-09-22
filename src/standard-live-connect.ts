import { LiveConnect, LiveConnectConfig } from './types';
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
import * as eventBus from './events/bus'
import * as emitter from './utils/emitter'
import * as errorHandler from './events/error-pixel'
import * as C from './utils/consts'
import { State, StateWrapper } from './pixel/state'
import { resolve as idResolve } from './manager/identifiers'
import { resolve as decisionsResolve } from './manager/decisions'
import { enrich as pageEnrich } from './enrichers/page'
import { enrich as identifiersEnrich } from './enrichers/identifiers'
import { enrich as privacyConfig } from './enrichers/privacy-config'
import { isArray, isObject, merge } from './utils/types'
import { identityResolver, IdentityResolver } from './idex/identity-resolver'
import { fromExternalStorageHandler } from './handlers/storage-handler'
import { CallHandler } from './handlers/call-handler'
import { StorageStrategy } from './model/storage-strategy'
import { HashedEmail } from './utils/hash';
import { ExternalStorageHandler } from './handlers/types';

interface HemStore {
  hashedEmail?: HashedEmail[]
}

const hemStore: HemStore = {}

function _pushSingleEvent(event: any, pixelClient: PixelSender, enrichedState: StateWrapper) {
  if (!event || !isObject(event)) {
    emitter.error('EventNotAnObject', 'Received event was not an object', new Error(event))
  } else if (event.config) {
    emitter.error('StrayConfig', 'Received a config after LC has already been initialised', new Error(event))
  } else {
    const combined = enrichedState.combineWith({ eventSource: event })
    hemStore.hashedEmail = hemStore.hashedEmail || combined.data.hashedEmail
    const withHemStore = merge({ eventSource: event }, hemStore)
    pixelClient.sendAjax(enrichedState.combineWith(withHemStore))
  }
}
interface ConfigMatcher {
  appId: string[],
  wrapperName: string[],
  collectorUrl: string[]
}

function _configMatcher(previousConfig: LiveConnectConfig, newConfig: LiveConnectConfig): ConfigMatcher | undefined {
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

function _processArgs(args: any[], pixelClient: PixelSender, enrichedState: StateWrapper): void {
  try {
    args.forEach(arg => {
      const event = arg
      if (isArray(event)) {
        (event as object[]).forEach(e => _pushSingleEvent(e, pixelClient, enrichedState))
      } else {
        _pushSingleEvent(event, pixelClient, enrichedState)
      }
    })
  } catch (e) {
    console.error('Error sending events', e)
    emitter.error('LCPush', 'Failed sending an event', e)
  }
}

function _getInitializedLiveConnect(liveConnectConfig: LiveConnectConfig): LiveConnect | undefined {
  try {
    if (window && window.liQ && window.liQ.ready) {
      const mismatchedConfig = window.liQ.config && _configMatcher(window.liQ.config, liveConnectConfig)
      if (mismatchedConfig) {
        const error = new Error()
        error.name = 'ConfigSent'
        error.message = 'Additional configuration received'
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
 * @returns {StandardLiveConnect}
 * @private
 */
function _standardInitialization(liveConnectConfig: LiveConnectConfig, externalStorageHandler: ExternalStorageHandler, externalCallHandler: any): LiveConnect {
  try {
    eventBus.init()
    const callHandler = CallHandler(externalCallHandler)
    const configWithPrivacy = merge(liveConnectConfig, privacyConfig(liveConnectConfig))
    errorHandler.register(configWithPrivacy, callHandler)
    const storageStrategy = configWithPrivacy.privacyMode ? StorageStrategy.disabled : configWithPrivacy.storageStrategy
    const storageHandler = fromExternalStorageHandler(storageStrategy, externalStorageHandler)
    const reducer = (accumulator, func) => accumulator.combineWith(func(accumulator.data, storageHandler))

    const enrichers = [pageEnrich, identifiersEnrich]
    const managers = [idResolve, decisionsResolve]

    const enrichedState = enrichers.reduce(reducer, new StateWrapper(configWithPrivacy))
    const postManagedState = managers.reduce(reducer, enrichedState)

    console.log('LiveConnect.enrichedState', enrichedState)
    console.log('LiveConnect.postManagedState', postManagedState)
    const syncContainerData = merge(configWithPrivacy, { peopleVerifiedId: postManagedState.data.peopleVerifiedId })
    const onPixelLoad = () => emitter.send(C.PIXEL_SENT_PREFIX, syncContainerData)
    const onPixelPreload = () => emitter.send(C.PRELOAD_PIXEL, '0')
    const pixelClient = new PixelSender(
      configWithPrivacy,
      callHandler,
      onPixelLoad,
      onPixelPreload,
    );
    const resolver = identityResolver(postManagedState.data, storageHandler, callHandler)
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
 * @returns {StandardLiveConnect}
 * @constructor
 */
export function StandardLiveConnect(liveConnectConfig, externalStorageHandler, externalCallHandler) {
  console.log('Initializing LiveConnect')
  try {
    const queue = window.liQ || []
    const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {}
    window && (window.liQ = _getInitializedLiveConnect(configuration) || _standardInitialization(configuration, externalStorageHandler, externalCallHandler) || queue)
    if (isArray(queue)) {
      for (let i = 0; i < queue.length; i++) {
        window.liQ.push(queue[i])
      }
    }
  } catch (x) {
    console.error(x)
    emitter.error('LCConstruction', 'Failed to build LC', x)
  }
  return window.liQ
}