import { StandardLiveConnect } from './standard-live-connect'
import { MinimalLiveConnect } from './minimal-live-connect'
import { CallHandler, StorageHandler, isObject, EventBus } from 'live-connect-common'
import { ILiveConnect, LiveConnectConfig } from './types'
import { LocalEventBus } from './events/event-bus'

export function LiveConnect(
  liveConnectConfig: LiveConnectConfig,
  externalStorageHandler: StorageHandler,
  externalCallHandler: CallHandler,
  mode: string,
  externalEventBus?: EventBus
): ILiveConnect | null {
  const minimalMode = mode === 'minimal' || process.env.LiveConnectMode === 'minimal'
  const bus = externalEventBus || LocalEventBus()
  const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {}
  const initializationFunction = minimalMode ? MinimalLiveConnect : StandardLiveConnect
  return initializationFunction(configuration, externalStorageHandler, externalCallHandler, bus)
}
