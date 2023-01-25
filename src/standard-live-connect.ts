// @ts-nocheck
import { PixelSender } from './pixel/sender'
import * as errorHandler from './events/error-pixel'
import * as C from './utils/consts'
import { StateWrapper } from './pixel/state'
import { resolve as idResolve } from './manager/identifiers'
import { resolve as decisionsResolve } from './manager/decisions'
import { enrich as pageEnrich } from './enrichers/page'
import { enrich as identifiersEnrich } from './enrichers/identifiers'
import { enrich as privacyConfig } from './enrichers/privacy-config'
import { removeInvalidPairs } from './config-validators/remove-invalid-pairs'
import { isArray, isObject, merge } from './utils/types'
import { IdentityResolver } from './idex'
import { StorageHandler } from './handlers/storage-handler'
import { CallHandler } from './handlers/call-handler'
import { StorageStrategy } from './model/storage-strategy'
import { ConfigMatcher, EventBus, ExternalCallHandler, ExternalStorageHandler, ILiveConnect, LiveConnectConfig, State } from './types'
import { LocalEventBus, getAvailableBus } from './events/event-bus'

const hemStore: State = {}
function _pushSingleEvent (event: any, pixelClient: PixelSender, enrichedState: StateWrapper, eventBus: EventBus) {
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

function _configMatcher (previousConfig: LiveConnectConfig, newConfig: LiveConnectConfig): ConfigMatcher {
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

function _getInitializedLiveConnect (liveConnectConfig: LiveConnectConfig): ILiveConnect {
  try {
    if (window && window[liveConnectConfig.globalVarName] && window[liveConnectConfig.globalVarName].ready) {
      const mismatchedConfig = window[liveConnectConfig.globalVarName].config && _configMatcher(window[liveConnectConfig.globalVarName].config, liveConnectConfig)
      if (mismatchedConfig) {
        const error = new Error()
        error.name = 'ConfigSent'
        error.message = 'Additional configuration received'
        const eventBus = getAvailableBus(liveConnectConfig.globalVarName)
        window[liveConnectConfig.globalVarName].eventBus = eventBus
        eventBus.emitErrorWithMessage('LCDuplication', JSON.stringify(mismatchedConfig), error)
      }
      return window[liveConnectConfig.globalVarName]
    }
  } catch (e) {
    console.error('Could not initialize error bus')
  }
}

function _standardInitialization (liveConnectConfig: LiveConnectConfig, externalStorageHandler: ExternalStorageHandler, externalCallHandler: ExternalCallHandler, eventBus: EventBus): ILiveConnect {
  try {
    const callHandler = new CallHandler(externalCallHandler, eventBus)
    const validLiveConnectConfig = removeInvalidPairs(liveConnectConfig, eventBus)
    const configWithPrivacy = merge(validLiveConnectConfig, privacyConfig(validLiveConnectConfig))
    errorHandler.register(configWithPrivacy, callHandler, eventBus)
    const storageStrategy = configWithPrivacy.privacyMode ? StorageStrategy.disabled : configWithPrivacy.storageStrategy
    const storageHandler = StorageHandler.make(storageStrategy, externalStorageHandler, eventBus)
    const reducer = (accumulator, func) => accumulator.combineWith(func(accumulator.data, storageHandler, eventBus))

    const enrichers = [pageEnrich, identifiersEnrich]
    const managers = [idResolve, decisionsResolve]

    const enrichedState = enrichers.reduce(reducer, new StateWrapper(configWithPrivacy, eventBus))
    const postManagedState = managers.reduce(reducer, enrichedState)

    const syncContainerData = merge(configWithPrivacy, { peopleVerifiedId: postManagedState.data.peopleVerifiedId })
    const onPixelLoad = () => eventBus.emit(C.PIXEL_SENT_PREFIX, syncContainerData)
    const onPixelPreload = () => eventBus.emit(C.PRELOAD_PIXEL, '0')
    const pixelClient = new PixelSender(configWithPrivacy, callHandler, eventBus, onPixelLoad, onPixelPreload)
    const resolver = IdentityResolver.make(postManagedState.data, storageHandler, callHandler, eventBus)
    const _push = (...args) => _processArgs(args, pixelClient, postManagedState, eventBus)
    return {
      push: _push,
      fire: () => _push({}),
      peopleVerifiedId: postManagedState.data.peopleVerifiedId,
      ready: true,
      resolve: resolver.resolve.bind(resolver),
      resolutionCallUrl: resolver.getUrl.bind(resolver),
      config: validLiveConnectConfig,
      eventBus: eventBus
    }
  } catch (x) {
    console.error(x)
    eventBus.emitErrorWithMessage('LCConstruction', 'Failed to build LC', x)
  }
}

export function StandardLiveConnect (liveConnectConfig: LiveConnectConfig, externalStorageHandler: ExternalStorageHandler, externalCallHandler: ExternalCallHandler, externalEventBus?: EventBus): ILiveConnect {
  const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {}
  configuration.globalVarName = configuration.globalVarName || 'liQ'
  const eventBus = externalEventBus || LocalEventBus()
  try {
    const queue = window[configuration.globalVarName] || []
    if (window) {
      window[configuration.globalVarName] = _getInitializedLiveConnect(configuration) || _standardInitialization(configuration, externalStorageHandler, externalCallHandler, eventBus) || queue
    }
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
