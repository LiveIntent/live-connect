import { StandardLiveConnect } from './standard-live-connect'
import { MinimalLiveConnect } from './minimal-live-connect'
import { CallHandler, StorageHandler, isObject } from 'live-connect-common'
import { EventBus, InternalLiveConnect, LiveConnectConfig } from './types'
import { LocalEventBus } from './events/event-bus'

export function LiveConnect(liveConnectConfig: LiveConnectConfig, externalStorageHandler: StorageHandler, externalCallHandler: CallHandler, mode: 'minimal' | string, externalEventBus?: EventBus): InternalLiveConnect {
  const minimalMode = mode === 'minimal'
  const bus = externalEventBus || LocalEventBus()
  const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {}
  const initializationFunction = minimalMode ? MinimalLiveConnect : StandardLiveConnect
  return initializationFunction(configuration, externalStorageHandler, externalCallHandler, bus)
}
