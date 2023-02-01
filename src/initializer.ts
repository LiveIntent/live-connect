import { StandardLiveConnect } from './standard-live-connect'
import { MinimalLiveConnect } from './minimal-live-connect'
import { isObject } from './utils/types'
import { EventBus, ExternalCallHandler, ExternalStorageHandler, ILiveConnect, LiveConnectConfig } from './types'

import { EVENT_BUS_NAMESPACE } from './utils/consts'
import { GlobalEventBus } from './events/event-bus'

export function LiveConnect (liveConnectConfig: LiveConnectConfig, externalStorageHandler: ExternalStorageHandler, externalCallHandler: ExternalCallHandler, mode: string, externalEventBus?: EventBus): ILiveConnect | null {
  const minimalMode = mode === 'minimal' || process.env.LiveConnectMode === 'minimal'
  const bus = externalEventBus || GlobalEventBus(EVENT_BUS_NAMESPACE, 5, err => console.error(err))
  const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {}
  const initializationFunction = minimalMode ? MinimalLiveConnect : StandardLiveConnect
  return initializationFunction(configuration, externalStorageHandler, externalCallHandler, bus)
}
