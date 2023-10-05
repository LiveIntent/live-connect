import { PixelSender } from './pixel/sender'
import * as C from './utils/consts'
import { StateWrapper } from './pixel/state'
import { mergeObjects } from './pixel/fiddler'
import { enrichPage } from './enrichers/page'
import { enrichIdentifiers } from './enrichers/identifiers'
import { enrichPrivacyMode } from './enrichers/privacy-config'
import { removeInvalidPairs } from './config-validators/remove-invalid-pairs'
import { isArray, isObject, CallHandler, StorageHandler } from 'live-connect-common'
import { IdentityResolver } from './idex'
import { ConfigMismatch, EventBus, ILiveConnect, LiveConnectConfig, State } from './types'
import { LocalEventBus, getAvailableBus } from './events/event-bus'
import { enrichDomain } from './enrichers/domain'
import { enrichStorageStrategy } from './enrichers/storage-strategy'
import { enrichDecisionIds } from './enrichers/decisions'
import { enrichLiveConnectId } from './enrichers/live-connect-id'
import { register as registerErrorPixel } from './events/error-pixel'
import { WrappedStorageHandler } from './handlers/storage-handler'
import { StorageHandlerBackedCache } from './cache'
import { WrappedCallHandler } from './handlers/call-handler'

const hemStore: State = {}
function _pushSingleEvent(event: unknown, pixelClient: PixelSender, enrichedState: State, eventBus: EventBus) {
  if (!event || !isObject(event)) {
    // @ts-ignore
    eventBus.emitErrorWithMessage('EventNotAnObject', 'Received event was not an object', new Error(event))
  } else if ('config' in event) {
    eventBus.emitErrorWithMessage('StrayConfig', 'Received a config after LC has already been initialised', new Error(JSON.stringify(event)))
  } else {
    const wrapper = new StateWrapper(enrichedState, eventBus)
    const combined = wrapper.combineWith({ eventSource: event })
    hemStore.hashedEmail = hemStore.hashedEmail || combined.data.hashedEmail
    const withHemStore = mergeObjects({ eventSource: event }, hemStore)

    const onPreSend = () => eventBus.emit(C.PRELOAD_PIXEL, '0')
    const onLoad = () => eventBus.emit(C.PIXEL_SENT_PREFIX, enrichedState)
    pixelClient.sendAjax(wrapper.combineWith(withHemStore), { onPreSend, onLoad })
  }
}

function _configMatcher(previousConfig: LiveConnectConfig, newConfig: LiveConnectConfig): ConfigMismatch | undefined {
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

function _processArgs(args: unknown[], pixelClient: PixelSender, enrichedState: State, eventBus: EventBus) {
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

function _getInitializedLiveConnect(liveConnectConfig: LiveConnectConfig): ILiveConnect | undefined {
  try {
    // @ts-ignore
    if (window && window[liveConnectConfig.globalVarName] && window[liveConnectConfig.globalVarName].ready) {
      // @ts-ignore
      const mismatchedConfig = window[liveConnectConfig.globalVarName].config && _configMatcher(window[liveConnectConfig.globalVarName].config, liveConnectConfig)
      if (mismatchedConfig) {
        const error = new Error()
        error.name = 'ConfigSent'
        error.message = 'Additional configuration received'
        // @ts-ignore
        const eventBus = getAvailableBus(liveConnectConfig.globalVarName)
        // @ts-ignore
        window[liveConnectConfig.globalVarName].eventBus = eventBus
        eventBus.emitErrorWithMessage('LCDuplication', JSON.stringify(mismatchedConfig), error)
      }
      // @ts-ignore
      return window[liveConnectConfig.globalVarName]
    }
  } catch (e) {
    console.error('Could not initialize error bus')
  }
}

// @ts-ignore
function _standardInitialization(liveConnectConfig: LiveConnectConfig, externalStorageHandler: StorageHandler, externalCallHandler: CallHandler, eventBus: EventBus): ILiveConnect {
  try {
    // TODO: proper config validation
    const validLiveConnectConfig = {
      ...removeInvalidPairs(liveConnectConfig, eventBus),
      identifiersToResolve: liveConnectConfig.identifiersToResolve || [],
      contextSelectors: liveConnectConfig.contextSelectors || '',
      contextElementsLength: liveConnectConfig.contextElementsLength || 0
    }

    const callHandler = new WrappedCallHandler(externalCallHandler, eventBus)

    const stateWithStorage =
      enrichPage(enrichStorageStrategy(enrichPrivacyMode(validLiveConnectConfig)))

    const storageHandler = WrappedStorageHandler.make(stateWithStorage.storageStrategy, externalStorageHandler, eventBus)

    const stateWithDomain = enrichDomain(storageHandler)(stateWithStorage)

    const cache = new StorageHandlerBackedCache({
      storageHandler,
      eventBus,
      cookieDomain: stateWithDomain.cookieDomain
    })

    const enrichedState =
      enrichLiveConnectId(cache, storageHandler)(
        enrichDecisionIds(storageHandler, eventBus)(
          enrichIdentifiers(storageHandler, eventBus)(
            stateWithDomain
          )))

    const pixelSender = new PixelSender({
      collectorUrl: validLiveConnectConfig.collectorUrl,
      ajaxTimeout: validLiveConnectConfig.ajaxTimeout,
      eventBus,
      callHandler
    })

    registerErrorPixel(enrichedState, pixelSender, eventBus)

    const resolver = IdentityResolver.make(enrichedState, cache, callHandler, eventBus)

    const _push = (...args: unknown[]) => _processArgs(args, pixelSender, enrichedState, eventBus)

    return {
      push: _push,
      fire: () => _push({}),
      peopleVerifiedId: enrichedState.peopleVerifiedId,
      ready: true,
      resolve: resolver.resolve.bind(resolver),
      resolutionCallUrl: resolver.getUrl.bind(resolver),
      config: validLiveConnectConfig,
      eventBus,
      storageHandler,
      cache
    }
  } catch (x) {
    console.error(x)
    eventBus.emitErrorWithMessage('LCConstruction', 'Failed to build LC', x)
  }
}

function _initializeWithoutGlobalName(liveConnectConfig: LiveConnectConfig, externalStorageHandler: StorageHandler, externalCallHandler: CallHandler, eventBus: EventBus): ILiveConnect {
  const lc = _standardInitialization(liveConnectConfig, externalStorageHandler, externalCallHandler, eventBus)
  window.liQ_instances = window.liQ_instances || []
  window.liQ_instances.push(lc)
  return lc
}

function _initializeWithGlobalName(liveConnectConfig: LiveConnectConfig, externalStorageHandler: StorageHandler, externalCallHandler: CallHandler, eventBus: EventBus): ILiveConnect {
  // @ts-ignore
  const queue = window[liveConnectConfig.globalVarName] || []
  const lc = _getInitializedLiveConnect(liveConnectConfig) || _standardInitialization(liveConnectConfig, externalStorageHandler, externalCallHandler, eventBus) || queue

  if (isArray(queue)) {
    for (let i = 0; i < queue.length; i++) {
      lc.push(queue[i])
    }
  }

  // @ts-ignore
  window[lc.config.globalVarName] = lc

  window.liQ_instances = window.liQ_instances || []
  // @ts-ignore
  if (window.liQ_instances.filter(i => i.config.globalVarName === lc.config.globalVarName).length === 0) {
    window.liQ_instances.push(lc)
  }
  return lc
}

export function StandardLiveConnect(liveConnectConfig: LiveConnectConfig, externalStorageHandler: StorageHandler, externalCallHandler: CallHandler, externalEventBus?: EventBus): ILiveConnect {
  const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {}
  const eventBus = externalEventBus || LocalEventBus()

  let lc
  try {
    lc = configuration.globalVarName
      ? _initializeWithGlobalName(configuration, externalStorageHandler, externalCallHandler, eventBus)
      : _initializeWithoutGlobalName(configuration, externalStorageHandler, externalCallHandler, eventBus)
  } catch (e) {
    console.error(e)
    eventBus.emitErrorWithMessage('LCConstruction', 'Failed to build LC', e)
  }
  // @ts-ignore
  return lc
}
