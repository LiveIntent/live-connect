import { CallHandler, EventBus, ReadOnlyStorageHandler, StorageHandler } from 'live-connect-common'
import { LiveConnect as _LiveConnect } from './initializer'
import { MinimalLiveConnect as _MinimalLiveConnect } from './minimal-live-connect'
import { StandardLiveConnect as _StandardLiveConnect } from './standard-live-connect'
import { LiveConnectConfig, PublicLiveConnect } from './types'

// upcasted versions of the internal APIs
export const LiveConnect: (
  liveConnectConfig: LiveConnectConfig,
  externalStorageHandler: StorageHandler,
  externalCallHandler: CallHandler,
  mode: string,
  externalEventBus?: EventBus
) => PublicLiveConnect | null = _LiveConnect

export const StandardLiveConnect: (
  liveConnectConfig: LiveConnectConfig,
  externalStorageHandler: StorageHandler,
  externalCallHandler: CallHandler,
  externalEventBus?: EventBus
) => PublicLiveConnect = _StandardLiveConnect

export const MinimalLiveConnect: (
  liveConnectConfig: LiveConnectConfig,
  externalStorageHandler: ReadOnlyStorageHandler,
  externalCallHandler: CallHandler,
  externalEventBus?: EventBus,
) => PublicLiveConnect = _MinimalLiveConnect

export * as eventBus from './events/event-bus'
export * as consts from './utils/consts'

export { PublicLiveConnect, LiveConnectConfig } from './types'

