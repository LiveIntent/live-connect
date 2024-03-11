import { LiveConnect as _LiveConnect } from './initializer.js'
import { MinimalLiveConnect as _MinimalLiveConnect } from './minimal-live-connect.js'
import { StandardLiveConnect as _StandardLiveConnect } from './standard-live-connect.js'
import { PublicLiveConnect, LiveConnectConfig } from './types.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Returning<F extends (...args: any) => any, T> = (...args: Parameters<F>) => T
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PublicConstructor<F extends (...args: any) => any> = Returning<F, PublicLiveConnect>

// upcasted versions of the internal APIs
export const LiveConnect: PublicConstructor<typeof _LiveConnect> = _LiveConnect

export const StandardLiveConnect: PublicConstructor<typeof _StandardLiveConnect> = _StandardLiveConnect

export const MinimalLiveConnect: PublicConstructor<typeof _MinimalLiveConnect> = _MinimalLiveConnect

export * as eventBus from './events/event-bus.js'
export * as consts from './utils/consts.js'

export { PublicLiveConnect, LiveConnectConfig }
