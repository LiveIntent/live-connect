import { StandardLiveConnect } from './standard-live-connect'
import { MinimalLiveConnect } from './minimal-live-connect'
import { isObject } from './utils/types'
import { EVENT_BUS_NAMESPACE } from './utils/consts'
import { GlobalEventBus } from './events/event-bus'

/**
* @param {LiveConnectConfiguration} liveConnectConfig
* @param {StorageHandler} externalStorageHandler
* @param {CallHandler} externalCallHandler
* @param {string} mode
* @param {EventBus} externalEventBus
* @returns {LiveConnect}
* @constructor
*/
export function LiveConnect (liveConnectConfig, externalStorageHandler, externalCallHandler, mode, externalEventBus) {
  console.log('Initializing LiveConnect', liveConnectConfig)
  const minimalMode = mode === 'minimal' || process.env.LiveConnectMode === 'minimal'
  const bus = externalEventBus || GlobalEventBus(EVENT_BUS_NAMESPACE, 5, err => console.error(err))
  const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {}
  const _initializationFunction = minimalMode ? MinimalLiveConnect : StandardLiveConnect
  return _initializationFunction(configuration, externalStorageHandler, externalCallHandler, bus)
}
