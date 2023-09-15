// @ts-nocheck
/* eslint-disable */
import { EnrichmentContext } from './pixel/fiddler'
import { IdentityResolver } from './idex'
import { enrichIdentifiers } from './enrichers/identifiers-nohash'
import { enrichPrivacyMode } from './enrichers/privacy-config'
import { removeInvalidPairs } from './config-validators/remove-invalid-pairs'
import { EventBus, ILiveConnect, LiveConnectConfig } from './types'
import { LocalEventBus } from './events/event-bus'
import { ReadOnlyStorageHandler, CallHandler, isObject } from 'live-connect-common'
import { enrichCallHandler } from './enrichers/call-handler'
import { enrichReadOnlyStorageHandler } from './enrichers/storage-handler'
import { enrichStorageStrategy } from './enrichers/storage-strategy'
import { enrichPeopleVerifiedId } from './enrichers/people-verified-id'

function _minimalInitialization(liveConnectConfig: LiveConnectConfig, externalStorageHandler: ReadOnlyStorageHandler, externalCallHandler: CallHandler, eventBus: EventBus, push: (event: unknown) => void): ILiveConnect {
  try {
    const validLiveConnectConfig = removeInvalidPairs(liveConnectConfig, eventBus)

    const stateBuilder = new EnrichmentContext({
      ...validLiveConnectConfig,
      identifiersToResolve: validLiveConnectConfig.identifiersToResolve || [],
      eventBus: eventBus,
      storageHandler: externalStorageHandler,
      callHandler: externalCallHandler
    })

    const enrichedState = stateBuilder
      .via(enrichCallHandler)
      .via(enrichPrivacyMode)
      .via(enrichStorageStrategy)
      .via(enrichReadOnlyStorageHandler)
      .via(enrichPeopleVerifiedId)
      .via(enrichIdentifiers)
      .data

    const resolver = IdentityResolver.makeNoCache(enrichedState, enrichedState.callHandler, eventBus)

    return {
      push: (arg) => push(arg),
      fire: () => push({}),
      peopleVerifiedId: enrichedState.peopleVerifiedId,
      ready: true,
      resolve: resolver.resolve.bind(resolver),
      resolutionCallUrl: resolver.getUrl.bind(resolver),
      config: validLiveConnectConfig,
      eventBus: eventBus,
      storageHandler: enrichedState.storageHandler
    }
  } catch (x) {
    console.error(x)
  }
}

function _initializeWithoutGlobalName(liveConnectConfig: LiveConnectConfig, externalStorageHandler: ReadOnlyStorageHandler, externalCallHandler: CallHandler, eventBus: EventBus) {
  const lc = _minimalInitialization(liveConnectConfig, externalStorageHandler, externalCallHandler, eventBus, (event: unknown) => {})
  window.liQ_instances = window.liQ_instances || []
  window.liQ_instances.push(lc)
  return lc
}

function _initializeWithGlobalName(liveConnectConfig: LiveConnectConfig, externalStorageHandler: ReadOnlyStorageHandler, externalCallHandler: CallHandler, eventBus: EventBus) {
  const queue = window[liveConnectConfig.globalVarName] = window[liveConnectConfig.globalVarName] || []
  const push = queue.push.bind(queue)
  const lc = _minimalInitialization(liveConnectConfig, externalStorageHandler, externalCallHandler, eventBus, push)

  window.liQ_instances = window.liQ_instances || []
  if (window.liQ_instances.filter(i => i.config.globalVarName === lc.config.globalVarName).length === 0) {
    window.liQ_instances.push(lc)
  }
  return lc
}

export function MinimalLiveConnect(liveConnectConfig: LiveConnectConfig, externalStorageHandler: ReadOnlyStorageHandler, externalCallHandler: CallHandler, externalEventBus?: EventBus): ILiveConnect {
  const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {}
  const eventBus = externalEventBus || LocalEventBus()
  try {
    return configuration.globalVarName ?
      _initializeWithGlobalName(configuration, externalStorageHandler, externalCallHandler, eventBus) :
      _initializeWithoutGlobalName(configuration, externalStorageHandler, externalCallHandler, eventBus)
  } catch (x) {
    console.error(x)
  }
  return {}
}
