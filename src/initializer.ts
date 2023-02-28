import { StandardLiveConnect } from './standard-live-connect'
import { MinimalLiveConnect } from './minimal-live-connect'
import { CallHandler, StorageHandler, isObject } from 'live-connect-common'
import { EventBus, ILiveConnect, LiveConnectConfig } from './types'

import { EVENT_BUS_NAMESPACE } from './utils/consts'
import { GlobalEventBus } from './events/event-bus'

export function LiveConnect(liveConnectConfig: LiveConnectConfig, externalStorageHandler: StorageHandler, externalCallHandler: CallHandler, mode: string, externalEventBus?: EventBus): ILiveConnect | null {
  const minimalMode = mode === 'minimal' || process.env.LiveConnectMode === 'minimal'
  const bus = externalEventBus || GlobalEventBus(EVENT_BUS_NAMESPACE, 5, err => console.error(err))
  const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {}
  const initializationFunction = minimalMode ? MinimalLiveConnect : StandardLiveConnect
  return initializationFunction(configuration, externalStorageHandler, externalCallHandler, bus)
}
