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
import { IdentityResolver } from './idex/identity-resolver'
import { StorageHandler } from './handlers/storage-handler'
import { CallHandler } from './handlers/call-handler'
import { StorageStrategy } from './model/storage-strategy'
import { ConfigMismatch, EventBus, ExternalCallHandler, ExternalStorageHandler, ILiveConnect, LiveConnectConfig, State } from './types'
import { LocalEventBus, getAvailableBus } from './events/event-bus'

const hemStore: State = {}

function _configMatcher (previousConfig: LiveConnectConfig, newConfig: LiveConnectConfig): ConfigMismatch | null {
  const equalConfigs = previousConfig.appId === newConfig.appId &&
    previousConfig.wrapperName === newConfig.wrapperName &&
    previousConfig.collectorUrl === newConfig.collectorUrl
  if (!equalConfigs) {
    return {
      appId: [previousConfig.appId, newConfig.appId],
      wrapperName: [previousConfig.wrapperName, newConfig.wrapperName],
      collectorUrl: [previousConfig.collectorUrl, newConfig.collectorUrl]
    }
  } else {
    return null
  }
}

function _pushSingleEvent (event: unknown, pixelClient: PixelSender, enrichedState: StateWrapper, eventBus: EventBus) {
  if (!event || !isObject(event)) {
    eventBus.emitErrorWithMessage('EventNotAnObject', `Received event was not an object: ${JSON.stringify(event)}`)
  } else if ('config' in event) {
    eventBus.emitErrorWithMessage('StrayConfig', `Received a config after LC has already been initialised: ${JSON.stringify(event)}`)
  } else {
    const combined = enrichedState.combineWith({ eventSource: event })
    hemStore.hashedEmail = hemStore.hashedEmail || combined.data.hashedEmail
    const withHemStore = merge({ eventSource: event }, hemStore)
    pixelClient.sendAjax(enrichedState.combineWith(withHemStore))
  }
}

function _processArgs (args: unknown[], pixelClient: PixelSender, enrichedState: StateWrapper, eventBus: EventBus) {
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

function _getInitializedLiveConnect (globalVarName: string, liveConnectConfig: LiveConnectConfig): ILiveConnect | null {
  try {
    if (!!window && globalVarName in window) {
      const candidate = window[globalVarName]
      if (isObject(candidate) && 'ready' in candidate && candidate.ready && 'config' in candidate && isObject(candidate.config)) {
        const mismatch = _configMatcher(candidate.config, liveConnectConfig)
        if (mismatch) {
          const error = new Error()
          error.name = 'ConfigSent'
          error.message = 'Additional configuration received'
          const eventBus = getAvailableBus(globalVarName)
          candidate.eventBus = eventBus
          eventBus.emitErrorWithMessage('LCDuplication', JSON.stringify(mismatch), error)
          return null
        } else {
          return candidate as ILiveConnect
        }
      }
    }
    return null
  } catch (e) {
    console.error('Could not initialize error bus')
    return null
  }
}

function _standardInitialization (liveConnectConfig: LiveConnectConfig, externalStorageHandler: ExternalStorageHandler, externalCallHandler: ExternalCallHandler, eventBus: EventBus): ILiveConnect {
  try {
    const callHandler = new CallHandler(externalCallHandler, eventBus)
    const validLiveConnectConfig = removeInvalidPairs(liveConnectConfig, eventBus)
    const configWithPrivacy = merge(validLiveConnectConfig, privacyConfig(validLiveConnectConfig))

    errorHandler.register(configWithPrivacy, callHandler, eventBus)

    const storageStrategy = !!configWithPrivacy.privacyMode ? StorageStrategy.disabled : (configWithPrivacy.storageStrategy || StorageStrategy.cookie)
    const storageHandler = new StorageHandler(storageStrategy, externalStorageHandler, eventBus)

    const reducer = (accumulator: StateWrapper, func: (state: State, storageHandler: StorageHandler, eventBus: EventBus) => State) =>
      accumulator.combineWith(func(accumulator.data, storageHandler, eventBus))

    const enrichers = [pageEnrich, identifiersEnrich]
    const managers = [idResolve, decisionsResolve]

    const enrichedState = enrichers.reduce(reducer, new StateWrapper(configWithPrivacy, eventBus))
    const postManagedState = managers.reduce(reducer, enrichedState)

    const syncContainerData = merge(configWithPrivacy, { peopleVerifiedId: postManagedState.data.peopleVerifiedId })
    const onPixelLoad = () => eventBus.emit(C.PIXEL_SENT_PREFIX, syncContainerData)
    const onPixelPreload = () => eventBus.emit(C.PRELOAD_PIXEL, '0')
    const pixelClient = new PixelSender(configWithPrivacy, callHandler, eventBus, onPixelLoad, onPixelPreload)
    const resolver = IdentityResolver(postManagedState.data, storageHandler, callHandler, eventBus)
    const _push = (...args: any[]) => _processArgs(args, pixelClient, postManagedState, eventBus)
    return {
      push: _push,
      fire: () => _push({}),
      peopleVerifiedId: postManagedState.data.peopleVerifiedId,
      ready: true,
      resolve: resolver.resolve,
      resolutionCallUrl: resolver.getUrl,
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

  const globalVarName = configuration.globalVarName

  try {
    if (untypedWindow) {
      const queue = untypedWindow[globalVarName] || []

      untypedWindow[globalVarName] = _getInitializedLiveConnect(configuration) || _standardInitialization(configuration, externalStorageHandler, externalCallHandler, eventBus) || queue


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
