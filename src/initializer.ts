import { StandardLiveConnect } from './standard-live-connect'
import { MinimalLiveConnect } from './minimal-live-connect'
import { isObject } from './utils/types'
const _minimalMode = process.env.LiveConnectMode === 'minimal'
const _initializationFunction = _minimalMode ? MinimalLiveConnect : StandardLiveConnect

/**
* @param {LiveConnectConfiguration} liveConnectConfig
* @param {StorageHandler} externalStorageHandler
* @param {CallHandler} externalCallHandler
* @returns {LiveConnect}
* @constructor
*/
export function LiveConnect (liveConnectConfig, externalStorageHandler, externalCallHandler) {
  console.log('Initializing LiveConnect', liveConnectConfig)
  const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {}
  return _initializationFunction(configuration, externalStorageHandler, externalCallHandler)
}
