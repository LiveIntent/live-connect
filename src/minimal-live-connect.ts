import { IdentityResolver } from './idex'
import { enrichPrivacyMode } from './enrichers/privacy-config'
import { removeInvalidPairs } from './config-validators/remove-invalid-pairs'
import { EventBus, InternalLiveConnect, LiveConnectConfig } from './types'
import { LocalEventBus } from './events/event-bus'
import { ReadOnlyStorageHandler, CallHandler, isObject } from 'live-connect-common'
import { enrichStorageStrategy } from './enrichers/storage-strategy'
import { enrichPeopleVerifiedId } from './enrichers/people-verified-id'
import { WrappedReadOnlyStorageHandler } from './handlers/storage-handler'
import { WrappedCallHandler } from './handlers/call-handler'
import { enrichIdentifiers } from './enrichers/identifiers-nohash'

// @ts-ignore
function _minimalInitialization(liveConnectConfig: LiveConnectConfig, externalStorageHandler: ReadOnlyStorageHandler, externalCallHandler: CallHandler, eventBus: EventBus, push: (...events: unknown[]) => void): InternalLiveConnect {
  try {
    const validLiveConnectConfig = {
      ...removeInvalidPairs(liveConnectConfig, eventBus),
      identifiersToResolve: liveConnectConfig.identifiersToResolve || []
    }

    const stateWithStorage =
      enrichStorageStrategy(enrichPrivacyMode(validLiveConnectConfig))

    const storageHandler = WrappedReadOnlyStorageHandler.make(stateWithStorage.storageStrategy, externalStorageHandler, eventBus)

    const callHandler = new WrappedCallHandler(externalCallHandler, eventBus)

    const enrichedState =
      enrichIdentifiers(storageHandler, eventBus)(
        enrichPeopleVerifiedId(storageHandler, eventBus)(
          stateWithStorage
        )
      )

    const resolver = new IdentityResolver(enrichedState, callHandler, eventBus)

    return {
      push: (arg) => push(arg),
      fire: () => push({}),
      peopleVerifiedId: enrichedState.peopleVerifiedId,
      ready: true,
      resolve: resolver.resolve.bind(resolver),
      resolutionCallUrl: resolver.getUrl.bind(resolver),
      config: validLiveConnectConfig,
      eventBus,
      // @ts-ignore
      storageHandler
    }
  } catch (x) {
    console.error(x)
  }
}

function initializeWithoutGlobalName(liveConnectConfig: LiveConnectConfig, externalStorageHandler: ReadOnlyStorageHandler, externalCallHandler: CallHandler, eventBus: EventBus): InternalLiveConnect {
  const lc = _minimalInitialization(liveConnectConfig, externalStorageHandler, externalCallHandler, eventBus, () => {})
  window.liQ_instances = window.liQ_instances || []
  window.liQ_instances.push(lc)
  return lc
}

function initializeWithGlobalName(liveConnectConfig: LiveConnectConfig, externalStorageHandler: ReadOnlyStorageHandler, externalCallHandler: CallHandler, eventBus: EventBus): InternalLiveConnect {
  // @ts-ignore
  const queue = window[liveConnectConfig.globalVarName] = window[liveConnectConfig.globalVarName] || []
  const push = queue.push.bind(queue)
  const lc = _minimalInitialization(liveConnectConfig, externalStorageHandler, externalCallHandler, eventBus, push)

  window.liQ_instances = window.liQ_instances || []
  // @ts-ignore
  if (window.liQ_instances.filter(i => i.config.globalVarName === lc.config.globalVarName).length === 0) {
    window.liQ_instances.push(lc)
  }
  return lc
}

export function MinimalLiveConnect(liveConnectConfig: LiveConnectConfig, externalStorageHandler: ReadOnlyStorageHandler, externalCallHandler: CallHandler, externalEventBus?: EventBus): InternalLiveConnect {
  const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {}
  const eventBus = externalEventBus || LocalEventBus()
  try {
    return configuration.globalVarName
      ? initializeWithGlobalName(configuration, externalStorageHandler, externalCallHandler, eventBus)
      : initializeWithoutGlobalName(configuration, externalStorageHandler, externalCallHandler, eventBus)
  } catch (x) {
    console.error(x)
  }
  // @ts-ignore
  return {}
}
