import { StandardLiveConnect } from './standard-live-connect'
import { MinimalLiveConnect } from './minimal-live-connect'
import { isObject } from './utils/types'
<<<<<<< HEAD:src/initializer.ts
import { ExternalCallHandler, ExternalStorageHandler, ILiveConnect, LiveConnectConfig } from './types'
const _minimalMode = process.env.LiveConnectMode === 'minimal'
const _initializationFunction = _minimalMode ? MinimalLiveConnect : StandardLiveConnect

export function LiveConnect (liveConnectConfig: LiveConnectConfig, externalStorageHandler: ExternalStorageHandler, externalCallHandler: ExternalCallHandler): ILiveConnect {
=======
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
>>>>>>> master:src/initializer.js
  console.log('Initializing LiveConnect', liveConnectConfig)
  const minimalMode = mode === 'minimal' || process.env.LiveConnectMode === 'minimal'
  const bus = externalEventBus || GlobalEventBus(EVENT_BUS_NAMESPACE, 5, err => console.error(err))
  const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {}
  const initializationFunction = minimalMode ? MinimalLiveConnect : StandardLiveConnect
  return initializationFunction(configuration, externalStorageHandler, externalCallHandler, bus)
}
