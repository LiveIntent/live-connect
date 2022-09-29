import { StandardLiveConnect } from './standard-live-connect'
import { MinimalLiveConnect } from './minimal-live-connect'
import { isObject } from './utils/types'
import { ExternalCallHandler, ExternalStorageHandler, ILiveConnect, LiveConnectConfig } from './types'
const _minimalMode = process.env.LiveConnectMode === 'minimal'
const _initializationFunction = _minimalMode ? MinimalLiveConnect : StandardLiveConnect

export function LiveConnect (liveConnectConfig: LiveConnectConfig, externalStorageHandler: ExternalStorageHandler, externalCallHandler: ExternalCallHandler): ILiveConnect {
  console.log('Initializing LiveConnect', liveConnectConfig)
  const configuration = (isObject(liveConnectConfig) && liveConnectConfig) || {}
  return _initializationFunction(configuration, externalStorageHandler, externalCallHandler)
}
